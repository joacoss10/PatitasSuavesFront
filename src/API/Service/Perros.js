import { apiFetch } from "../Config/ApiClient";

export async function obtenerPerros() {
  try {
    // El ID del cliente se obtiene del token en el backend.
    const url = `/me/perros`;
    const token = localStorage.getItem("demo_token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};

    const response = await apiFetch(url, {
      method: "GET",
      headers
    });
    return response;
  } catch (err) {
    throw new Error(err.error || err.message || "Error al obtener perros");
  }
}

export async function registrarPerro({ nombre, observaciones, tamanioPerro }) {
  try {
    const token = localStorage.getItem("demo_token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    const response = await apiFetch("/perros/registro", {
      method: "POST",
      body: { nombre, observaciones, tamanioPerro },
      headers
    });
    return response;
  } catch (err) {
    throw new Error(err.error || err.message || "Error al registrar perro");
  }
}

export async function eliminarPerro(idPerro) {
  try {
    const token = localStorage.getItem("demo_token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    const response = await apiFetch(`/perros?idPerro=${encodeURIComponent(idPerro)}`, {
      method: "DELETE",
      headers
    });
    return response;
  } catch (err) {
    throw new Error(err.error || err.message || "Error al eliminar perro");
  }
}

export async function obtenerDatosCliente() {
  try {
    const token = localStorage.getItem("demo_token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    const response = await apiFetch(`/me/datos`, {
      method: "GET",
      headers
    });
    return response;
  } catch (err) {
    throw new Error(err.error || err.message || "Error al obtener datos del cliente");
  }
}

export async function modificarDatosCliente(datos) {
  try {
    const token = localStorage.getItem("demo_token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    
    const dto = {
      nombre: datos.nombre,
      telefono: String(datos.telefono)
    };

    const response = await apiFetch("/me/modificarDatos", {
      method: "POST",
      body: dto,
      headers
    });
    return response;
  } catch (err) {
    throw new Error(err.error || err.message || "Error al modificar datos del cliente");
  }
}

export async function obtenerTurnosCliente(estado) {
  try {
    const token = localStorage.getItem("demo_token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    const response = await apiFetch(`/me/turnos?estadoTurno=${encodeURIComponent(estado)}`, {
      method: "GET",
      headers
    });
    return response;
  } catch (err) {
    throw new Error(err.error || err.message || "Error al obtener turnos");
  }
}

export async function cancelarTurno(idTurno) {
  try {
    const token = localStorage.getItem("demo_token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    const response = await apiFetch(`/turno/cancelarTurno?idTurno=${encodeURIComponent(idTurno)}`, {
      method: "POST",
      headers
    });
    return response;
  } catch (err) {
    throw new Error(err.error || err.message || "Error al cancelar turno");
  }
}
