

import axios from "axios";

/**
 * Create a reusable axios instance
 */
const api = axios.create({
    baseURL: "http://localhost:5000/api"
});


/**
 * AUTO-ATTACH TOKEN TO EVERY REQUEST
 */
api.interceptors.request.use(
    (config) => {

        // Get token from localStorage
        const token = localStorage.getItem("token");

        // If token exists, attach it
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);

export default api;