import { ClimateApi, Configuration } from "./client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const config = new Configuration({
    basePath: API_BASE_URL
});

export const climateApi = new ClimateApi(config);