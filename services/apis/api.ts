
import axios from "axios";

/* export default function createAxiosInstance(headers = {}) {
    if (localStorage.getItem("authToken")) {
        headers = {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
    }
    return axios.create({
        baseURL: "http://localhost:3000",
        headers,
    });
}
 */


const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000', headers: {
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`
    }
})


export default axiosInstance