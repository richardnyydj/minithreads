import { AxiosHeaders, AxiosRequestConfig } from 'axios';
const Cookies = require('js-cookie');
const AUTH_COOKIE = 'auth_token';
export const CSRF_COOKIE = 'csrf_token';

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_PORT == undefined || process.env.NEXT_PUBLIC_API_PORT == 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
  } else {
    return process.env.NEXT_PUBLIC_API_URL + ":" + process.env.NEXT_PUBLIC_API_PORT;
  }
}

export const apiBaseUrl = getApiUrl() + "/api";
export const wsBaseUrl = getApiUrl() + "/ws";

export function getConfig(auth: boolean): AxiosRequestConfig {
  const header = new AxiosHeaders({
    'Cache-Control': 'no-cache, must-revalidate',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  if (auth) {
    header.setAuthorization(`Bearer ${Cookies.get(AUTH_COOKIE)}`);
    header.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  }

  return { headers: header };
}

export const noAuthConfig = getConfig(false);
export const authConfig = getConfig(true);
