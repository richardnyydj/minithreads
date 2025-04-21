"use client";

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EntityStatus } from '../../model/model';
import { getAuth } from '../../store/features/user/actions/authActions';
import { selectError, selectStatus, selectUser } from '../../store/features/user/selectors/authSelectors';
import { AppDispatch } from '../../store/store';
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { wsBaseUrl } from '@/app/api/util';

interface LoginFormData {
  username: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const status = useSelector(selectStatus) as string;
  const apiErrorMsg = useSelector(selectError) as string;
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const user = useSelector(selectUser);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const socket = new SockJS(wsBaseUrl);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000, // Auto-reconnect
      debug: (str) => console.log(str), // Debugging logs
    });

    client.onConnect = (frame) => {
      console.log("Connected: " + frame);
    };

    client.activate(); // Connect to the WebSocket

    setStompClient(client);

    return () => {
      client.deactivate(); // Cleanup on unmount
    };
  }, []); // 依賴 user，確保只有在 user 存在時才執行

  useEffect(() => {
    if (status === EntityStatus.SUCCESS) {
      stompClient?.publish({ destination: "/app/sendNotification", body: 
        JSON.stringify({
          sender: formData.username,
          receiver: formData.username,
          content: "Hello, Login Notification " + new Date().toLocaleString()
        })
      });
      router.push('/me/threads');
    }
  }, [status]);

  useEffect(() => {
    if (apiErrorMsg && apiErrorMsg.includes('401')) {
      setErrorMessage("The username or passoword you entered is invalid.");
    }
  }, [apiErrorMsg]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  if (status === EntityStatus.LOADING || status === EntityStatus.SUCCESS) {
    return (
      <>
        <div className='absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center'>
          <div className='loader'></div>
          <p className='loading-msg'>{
            (status === EntityStatus.LOADING) ? `${EntityStatus.LOADING}...` : "verifying..."
          }</p>
        </div>
      </>);
  }

  if (!isClient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Basic validation
    if (!formData.username || !formData.password) {
      setErrorMessage('All fields are required.');
      return;
    }

    const formDataObj = new FormData();
    formDataObj.append('username', formData.username);
    formDataObj.append('password', formData.password);
    dispatch(getAuth(formDataObj));
  };

  return (
    <div className="w-full h-full p-6 bg-white/75 sm:shadow-md sm:rounded-lg">
      <h2 className="text-xl font-bold my-4 text-center text-secondaryDark">Login with existing account</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-500">username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-primary rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-500">password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-primary rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        {errorMessage && <p className="mt-4 text-sm text-red-500">{errorMessage || apiErrorMsg}</p>}
        {successMessage && <p className="mt-4 text-sm text-green-500">{successMessage}</p>}
        <div className='flex w-full gap-5 text-center'>
          <button
            type="submit"
            className="grow col-6 bg-secondaryDark text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
            Login
          </button>
          <button
            className="grow col-6 bg-secondary text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() => router.back()}>
            No, not yet.
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;