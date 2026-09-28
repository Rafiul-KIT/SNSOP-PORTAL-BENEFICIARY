/**
 * Minimal evaluator for small float32 TFLite classifiers: a chain of FULLY_CONNECTED
 * layers (no activation or ReLU) ending in an optional SOFTMAX.
 *
 * It reads the weights straight from the .tflite flatbuffer, so a tiny model runs in
 * microseconds without downloading a TFLite runtime. Any other op, dtype or graph shape
 * is rejected at parse time; a retrained model that needs more must be supported here first.
 * Field ids follow tensorflow/lite/schema/schema.fbs.
 */

/** BuiltinOperator */
const FULLY_CONNECTED = 9;
const SOFTMAX = 25;
/** ActivationFunctionType */
const ACTIVATION_NONE = 0;
const ACTIVATION_RELU = 1;
/** TensorType */
const FLOAT32 = 0;

interface DenseLayer {
  inputSize: number;
  outputSize: number;
  /** Row-major [outputSize, inputSize], as TFLite stores FULLY_CONNECTED weights. */
  weights: Float32Array;
  bias: Float32Array | null;
  relu: boolean;
}

export class TfliteMlp {
  private constructor(
    private readonly layers: DenseLayer[],
    /** Softmax beta, or null when the graph ends on the last dense layer. */
    private readonly softmaxBeta: number | null,
  ) {}

  get inputSize(): number {
    return this.layers[0].inputSize;
  }

  get outputSize(): number {
    return this.layers[this.layers.length - 1].outputSize;
  }

  static parse(bytes: Uint8Array): TfliteMlp {
    const { layers, softmaxBeta } = parseModel(new FlatBufferReader(bytes));
    return new TfliteMlp(layers, softmaxBeta);
  }

  run(input: Float32Array): Float32Array {
    if (input.length !== this.inputSize) {
      throw new Error(
        `Expected ${this.inputSize} input features, got ${input.length}.`,
      );
    }
    let x = input;
    for (const { inputSize, outputSize, weights, bias, relu } of this.layers) {
      const y = new Float32Array(outputSize);
      for (let o = 0; o < outputSize; o++) {
        let sum = bias ? bias[o] : 0;
        const row = o * inputSize;
        for (let i = 0; i < inputSize; i++) {
          sum += weights[row + i] * x[i];
        }
        y[o] = relu && sum < 0 ? 0 : sum;
      }
      x = y;
    }
    return this.softmaxBeta === null ? x : softmax(x, this.softmaxBeta);
  }
}

function softmax(logits: Float32Array, beta: number): Float32Array {
  const max = Math.max(...logits);
  const exps = logits.map((v) => Math.exp((v - max) * beta));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

function parseModel(fb: FlatBufferReader): {
  layers: DenseLayer[];
  softmaxBeta: number | null;
} {
  if (fb.identifier() !== 'TFL3') {
    throw new Error('Not a TFLite model (missing TFL3 identifier).');
  }
  const model = fb.root();
  const opcodes = fb.tables(model, 1).map((code) =>
    // deprecated_builtin_code (int8) holds codes < 127; builtin_code (int32) holds the rest.
    Math.max(fb.int8(code, 0), fb.int32(code, 3)),
  );
  const buffers = fb.tables(model, 4).map((buffer) => fb.bytes(buffer, 0));

  const subgraphs = fb.tables(model, 2);
  if (subgraphs.length !== 1) {
    throw new Error(`Expected 1 subgraph, found ${subgraphs.length}.`);
  }
  const graph = subgraphs[0];
  const tensors = fb.tables(graph, 0).map((tensor) => ({
    shape: fb.ints(tensor, 0),
    type: fb.int8(tensor, 1),
    data: buffers[fb.uint32(tensor, 2)] ?? null,
  }));
  const graphInputs = fb.ints(graph, 1);
  const graphOutputs = fb.ints(graph, 2);
  if (graphInputs.length !== 1 || graphOutputs.length !== 1) {
    throw new Error('Expected a single input and a single output tensor.');
  }

  const constant = (index: number, rank: number, what: string) => {
    const tensor = tensors[index];
    if (tensor?.type !== FLOAT32 || tensor.shape.length !== rank || !tensor.data) {
      throw new Error(`${what} must be a constant float32 tensor of rank ${rank}.`);
    }
    return { shape: tensor.shape, values: toFloat32(tensor.data) };
  };

  const layers: DenseLayer[] = [];
  let softmaxBeta: number | null = null;
  let current = graphInputs[0];
  for (const op of fb.tables(graph, 3)) {
    const code = opcodes[fb.uint32(op, 0)];
    const [input, weightIndex, biasIndex] = fb.ints(op, 1);
    const outputs = fb.ints(op, 2);
    if (input !== current || outputs.length !== 1 || softmaxBeta !== null) {
      throw new Error('Only a single chain of layers ending in SOFTMAX is supported.');
    }
    const options = fb.table(op, 4);

    if (code === FULLY_CONNECTED) {
      const activation = options ? fb.int8(options, 0) : ACTIVATION_NONE;
      if (activation !== ACTIVATION_NONE && activation !== ACTIVATION_RELU) {
        throw new Error(`Unsupported fused activation ${activation}.`);
      }
      const weights = constant(weightIndex, 2, 'FULLY_CONNECTED weights');
      const [outputSize, inputSize] = weights.shape;
      const bias =
        biasIndex === undefined || biasIndex < 0
          ? null
          : constant(biasIndex, 1, 'FULLY_CONNECTED bias').values;
      const expectedInput = layers.length
        ? layers[layers.length - 1].outputSize
        : tensors[current].shape.at(-1);
      if (inputSize !== expectedInput || (bias && bias.length !== outputSize)) {
        throw new Error('FULLY_CONNECTED tensor shapes do not line up.');
      }
      layers.push({
        inputSize,
        outputSize,
        weights: weights.values,
        bias,
        relu: activation === ACTIVATION_RELU,
      });
    } else if (code === SOFTMAX && layers.length) {
      softmaxBeta = options ? fb.float32(options, 0) : 0;
    } else {
      throw new Error(`Unsupported TFLite operator ${code}.`);
    }
    current = outputs[0];
  }

  if (!layers.length || current !== graphOutputs[0]) {
    throw new Error('Model output is not produced by the layer chain.');
  }
  return { layers, softmaxBeta };
}

/** Copies, since constant buffers aren't guaranteed to be 4-byte aligned in the file. */
function toFloat32(bytes: Uint8Array): Float32Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const values = new Float32Array(bytes.byteLength / 4);
  for (let i = 0; i < values.length; i++) {
    values[i] = view.getFloat32(i * 4, true);
  }
  return values;
}

/** Just enough of the FlatBuffers wire format to read tables, scalars and vectors. */
class FlatBufferReader {
  private readonly view: DataView;

  constructor(private readonly data: Uint8Array) {
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  }

  identifier(): string {
    return String.fromCharCode(...this.data.subarray(4, 8));
  }

  root(): number {
    return this.view.getUint32(0, true);
  }

  /** Absolute position of a table's field, or 0 when the field is absent. */
  private field(table: number, id: number): number {
    const vtable = table - this.view.getInt32(table, true);
    const entry = 4 + id * 2;
    if (entry >= this.view.getUint16(vtable, true)) return 0;
    const offset = this.view.getUint16(vtable + entry, true);
    return offset ? table + offset : 0;
  }

  private deref(pos: number): number {
    return pos + this.view.getUint32(pos, true);
  }

  int8(table: number, id: number): number {
    const pos = this.field(table, id);
    return pos ? this.view.getInt8(pos) : 0;
  }

  int32(table: number, id: number): number {
    const pos = this.field(table, id);
    return pos ? this.view.getInt32(pos, true) : 0;
  }

  uint32(table: number, id: number): number {
    const pos = this.field(table, id);
    return pos ? this.view.getUint32(pos, true) : 0;
  }

  float32(table: number, id: number): number {
    const pos = this.field(table, id);
    return pos ? this.view.getFloat32(pos, true) : 0;
  }

  table(table: number, id: number): number | null {
    const pos = this.field(table, id);
    return pos ? this.deref(pos) : null;
  }

  /** [start, length] of a vector field, or null when absent. */
  private vector(table: number, id: number): [number, number] | null {
    const pos = this.field(table, id);
    if (!pos) return null;
    const vec = this.deref(pos);
    return [vec + 4, this.view.getUint32(vec, true)];
  }

  tables(table: number, id: number): number[] {
    const vec = this.vector(table, id);
    if (!vec) return [];
    return Array.from({ length: vec[1] }, (_, i) => this.deref(vec[0] + i * 4));
  }

  ints(table: number, id: number): number[] {
    const vec = this.vector(table, id);
    if (!vec) return [];
    return Array.from({ length: vec[1] }, (_, i) =>
      this.view.getInt32(vec[0] + i * 4, true),
    );
  }

  bytes(table: number, id: number): Uint8Array | null {
    const vec = this.vector(table, id);
    return vec && vec[1] ? this.data.subarray(vec[0], vec[0] + vec[1]) : null;
  }
}
