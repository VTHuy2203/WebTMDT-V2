import http from "k6/http";
import { check } from "k6";

export const options = {
  scenarios: {
    catalog_500_rps: {
      executor: "constant-arrival-rate",
      rate: Number(__ENV.TARGET_RPS || 500),
      timeUnit: "1s",
      duration: __ENV.DURATION || "2m",
      preAllocatedVUs: Number(__ENV.PREALLOCATED_VUS || 100),
      maxVUs: Number(__ENV.MAX_VUS || 500),
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<300"],
    checks: ["rate>0.99"],
  },
};

const baseUrl = (__ENV.BASE_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function () {
  const response = http.get(`${baseUrl}/products?page=1&pageSize=12`, {
    tags: { endpoint: "catalog" },
    headers: { "X-Client-App": "load-test" },
  });
  check(response, {
    "catalog returns 200": (result) => result.status === 200,
    "catalog response is JSON": (result) => String(result.headers["Content-Type"] || "").includes("application/json"),
  });
}
