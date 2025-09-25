import { Injectable, signal } from '@angular/core';
import axios from 'axios';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private globalApi: string = environment.globalApi;
  public loginState = signal({
    token: null,
    user: null,
  });
  public ACCESS_TOKEN = environment.cookie_name;
  private apiHeader: any = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  axiosInstance = axios.create({
    baseURL: this.globalApi, // ✅ already sets baseURL
  });

  constructor(private cookieService: CookieService, private router: Router) {
    const accessToken: any = this.cookieService.get(this.ACCESS_TOKEN);
    if (accessToken) {
      const userData: any = jwtDecode(accessToken);
      this.loginState.set({
        token: accessToken,
        user: userData,
      });
      this.axiosInstance.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${accessToken}`;
    }
  }

  logout = () => {
    this.cookieService.deleteAll('/', environment.domain, false);
    this.loginState.set({ token: null, user: null });

    // Build redirect URL dynamically
    const landingPath = environment.useHash ? '/#/landing' : '/landing';
    const redirectUrl = `${environment.portals.master}${landingPath}`;

    window.location.href = redirectUrl;
  };

  // ================= Basic HTTP Functions =================
  GET = (endpoint: string) => {
    return this.axiosInstance.get(endpoint, this.apiHeader);
  };

  POST = (endpoint: string, payload: {}) => {
    return this.axiosInstance.post(endpoint, payload, this.apiHeader);
  };

  PUTWITHPAYLOAD = (endpoint: string, payload: {}) => {
    return this.axiosInstance.put(endpoint, payload, this.apiHeader);
  };

  PUT = (endpoint: string) => {
    return this.axiosInstance.put(endpoint, {}, this.apiHeader);
  };

  PATCH = (endpoint: string, payload: {}) => {
    return this.axiosInstance.patch(endpoint, payload, this.apiHeader);
  };

  DELETE = (endpoint: string) => {
    return this.axiosInstance.delete(endpoint, this.apiHeader);
  };
}
