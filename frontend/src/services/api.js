import axios from "axios";

const API_URL = "http://localhost:8000";

// Dataset API
export const datasetAPI = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post(`${API_URL}/api/dataset/upload`, formData);
    return response.data;
  },

  generate: async (type) => {
    const response = await axios.post(`${API_URL}/api/dataset/generate/${type}`);
    return response.data;
  },

  getInfo: async () => {
    const response = await axios.get(`${API_URL}/api/dataset/info`);
    return response.data;
  },
};

// Training API
export const trainingAPI = {
  gradientStep: async () => {
    const response = await axios.post(`${API_URL}/api/gradient/step`);
    return response.data;
  },

  pointStep: async () => {
    const response = await axios.post(`${API_URL}/api/gradient/point-step`);
    return response.data;
  },

  resetPointMode: async () => {
    const response = await axios.post(`${API_URL}/api/gradient/point-reset`);
    return response.data;
  },

  getCurrentState: async () => {
    const response = await axios.get(`${API_URL}/api/state/current`);
    return response.data;
  },

  setLearningRate: async (learningRate) => {
    const response = await axios.post(`${API_URL}/api/config/learning-rate`, {
      learning_rate: learningRate,
    });
    return response.data;
  },

  resetModel: async () => {
    const response = await axios.post(`${API_URL}/api/model/reset`);
    return response.data;
  },

  resetAll: async () => {
    const response = await axios.post(`${API_URL}/api/reset`);
    return response.data;
  },
};
