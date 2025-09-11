import { Injectable, signal } from '@angular/core';
import axios from 'axios';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../environments/environment.development';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private globalApi: any = environment.globalApi;
  private globalContentApi = `${environment.globalApi}/contentservice`;
  public loginState = signal({
    token: null,
    user: null,
  });

  public ACCESS_TOKEN = 'mis_ta';
  public REFRESH_TOKEN = 'mis_tr';
  public USER_ID = 'mis_uid';
  public USER_SELLER_ID = 'mis_usid';
  public USER_ROLE = 'mis_rl';
  private multiPartApiHeader = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  private apiHeader: any = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  axiosInstance = axios.create({
    baseURL: this.globalApi,
  });

  constructor(private cookieService: CookieService, private router: Router) {
    const accessToken: any = this.cookieService.get(this.ACCESS_TOKEN);
    if (accessToken) {
      const userData: any = jwtDecode(accessToken);
      this.loginState.set({
        token: accessToken,
        user: userData,
      });
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // ########################### Refresh Token Functionality Start ############################
    this.axiosInstance.interceptors.request.use(
      (request: any) => {
        request.headers['Time-Zone'] = timeZone;
        const accessToken: any = this.cookieService.get(this.ACCESS_TOKEN);
        if (accessToken) {
          request.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return request;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response, // Directly return successful responses.
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response &&
          error.response.status === 401 &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true; // Mark the request as retried to avoid infinite loops.
          try {
            const apiHeader = {
              headers: {
                'Content-Type': 'application/json',
                'Refresh-Token': this.cookieService.get(this.REFRESH_TOKEN),
              },
            };
            // Make a request to your auth server to refresh the token.
            const response = await axios.get(
              `${environment.globalApi}/ums/api/authenticate/newAccessToken`,
              apiHeader
            );
            const accessToken = response.data.data.content.accessToken;
            const refreshToken = response.data.data.content.refreshToken;
            this.cookieService.set(
              this.ACCESS_TOKEN,
              accessToken,
              1,
              '/',
              environment.domain
            );
            this.cookieService.set(
              this.REFRESH_TOKEN,
              refreshToken,
              1,
              '/',
              environment.domain
            );
            // Update the authorization header with the new access token.
            this.axiosInstance.defaults.headers.common[
              'Authorization'
            ] = `Bearer ${response.data.data.content.accessToken}`;
            return this.axiosInstance(originalRequest); // Retry the original request with the new access token.
          } catch (refreshError) {
            // Handle refresh token errors by clearing stored tokens and redirecting to the login page.
            console.error('Token refresh failed:', refreshError);
            // this.helperService.logout();
            return Promise.reject(refreshError);
          }
        } else if (error.response && error.response.status === 403) {
          return Promise.reject(error);
        }
        return Promise.reject(error); // For all other errors, return the error as is.
      }
    );

    // ########################### Refresh Token Functionality End ############################
  }

  // ########################### Handle Login ############################

  setToken = (jwtToken: any) => {
    const userData: any = jwtDecode(jwtToken);
    console.log(userData);
    this.loginState.set({
      token: jwtToken,
      user: userData,
    });
    this.cookieService.set(
      this.ACCESS_TOKEN,
      jwtToken,
      1,
      '/',
      environment.domain
    );
    this.router.navigateByUrl('/dashboard');
  };

  logout = () => {
    console.log('logout');
    this.cookieService.deleteAll('/', environment.domain, false);
    this.loginState.set({
      token: null,
      user: null,
    });
    this.router.navigateByUrl('/auth/sign-in');
  };

  // ########################### Basic HTTP Functions ############################

  // Http post Method
  GET = (endpoint: string) => {
    return this.axiosInstance.get(
      `${this.globalApi}/${endpoint}`,
      this.apiHeader
    );
  };

  // Http post Method
  POST = (endpoint: string, payload: {}) => {
    return this.axiosInstance.post(
      `${this.globalApi}/${endpoint}`,
      payload,
      this.apiHeader
    );
  };

  PUTWITHPAYLOAD = (endpoint: string, payload: {}) => {
    return this.axiosInstance.put(
      `${this.globalApi}/${endpoint}`,
      payload,
      this.apiHeader
    );
  };

  PUT = (endpoint: string) => {
    return this.axiosInstance.put(
      `${this.globalApi}/${endpoint}`,
      {},
      this.apiHeader
    );
  };

  // Http patch Method
  PATCH = (endpoint: string, payload: {}) => {
    return this.axiosInstance.patch(
      `${this.globalApi}/${endpoint}`,
      payload,
      this.apiHeader
    );
  };

  DELETE = (endpoint: string) => {
    return this.axiosInstance.delete(
      `${this.globalApi}/${endpoint}`,
      this.apiHeader
    );
  };

  refreshTokenManually = async () => {
    console.log('refreshTokenManually');
    try {
      const apiHeader = {
        headers: {
          'Content-Type': 'application/json',
          'Refresh-Token': this.cookieService.get(this.REFRESH_TOKEN),
        },
      };
      // Make a request to your auth server to refresh the token.
      const response = await axios.get(
        `${environment.globalApi}/ums/api/authenticate/newAccessToken`,
        apiHeader
      );
      const accessToken = response.data.data.content.accessToken;
      const refreshToken = response.data.data.content.refreshToken;
      const decoded: any = jwtDecode(accessToken);
      this.cookieService.set(
        this.ACCESS_TOKEN,
        accessToken,
        1,
        '/',
        environment.domain
      );
      this.cookieService.set(
        this.REFRESH_TOKEN,
        refreshToken,
        1,
        '/',
        environment.domain
      );
      this.cookieService.set(
        this.USER_ID,
        decoded.sub,
        1,
        '/',
        environment.domain
      );
      this.cookieService.set(
        this.USER_ROLE,
        decoded.userType,
        1,
        '/',
        environment.domain
      );
    } catch (refreshError) {
      // Handle refresh token errors by clearing stored tokens and redirecting to the login page.
      console.error('Token refresh failed:', refreshError);
    }
  };

  // ################################# Specific HTTP Functions ##########################################

  uploadImage = (endpoint: string, payload: {}) => {
    return this.axiosInstance.post(
      `${this.globalContentApi}/${endpoint}`,
      payload,
      this.multiPartApiHeader
    );
  };

  getUserProfile = (endpoint: string) => {
    return this.axiosInstance.get(
      `${environment.globalApi}/ums/${endpoint}`,
      this.apiHeader
    );
  };
}
