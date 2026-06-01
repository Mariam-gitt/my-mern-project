

import axios from "axios";

/**
 * Create a reusable axios instance
 */
// const api = axios.create({
//     baseURL: "http://localhost:5000/api"
// });

const api = axios.create({
    // Replace this string with your actual live Vercel URL
    baseURL: "https://my-mern-project-backend-qxjzxcdjd-mariam-s-projects11.vercel.app/api"
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