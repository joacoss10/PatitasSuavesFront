const Base_Url="http://localhost:8080";

function getToken(){
  const t = localStorage.getItem("demo_token");
  if (!t || t === "undefined" || t === "null") return "";
  return t;
}
export async function apiFetch(path,{method="GET",body,headers}={}) {
  const token = getToken();
  // console.log("Token enviado:", token); // Descomentar para depurar

  const res = await fetch(`${Base_Url}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = res.headers.get("content-type") || "";
  
  let data;
  if (contentType.includes("application/json")) {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const msg = typeof data === "string" ? data : data?.message || "Error";
    throw new Error(msg);
  }
  return data;
}
