import { apiFetch } from "../Config/ApiClient";

function checkError(response) {
  if (response && response.error) {
    throw new Error(response.error);
  }
  return response;
}

export async function obtenerServicios() {
  try {
    const response = await apiFetch("/admin/obtenerServicio", {
      method: "GET",
    });
    return checkError(response);
  } catch (err) {
    throw new Error(err.message || "Error al obtener servicios");
  }
}

export async function obtenerTurnosPendientes() {
  try {
    const token = localStorage.getItem("demo_token");
    const response = await apiFetch("/admin/turnosPendientes", {
      method: "GET",
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    });
    return checkError(response);
  } catch (err) {
    throw new Error(err.message || "Error al obtener turnos pendientes");
  }
}

export async function obtenerTurnosConfirmados() {
  try {
    const token = localStorage.getItem("demo_token");
    const response = await apiFetch("/admin/turnosConfirmados", {
      method: "GET",
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    });
    return checkError(response);
  } catch (err) {
    throw new Error(err.message || "Error al obtener turnos confirmados");
  }
}

export async function confirmarTurno(idTurno) {
  try {
    const token = localStorage.getItem("demo_token");
    const response = await apiFetch(`/admin/confirmarTurno?idTurno=${encodeURIComponent(idTurno)}`, {
      method: "POST",
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    });
    return checkError(response);
  } catch (err) {
    throw new Error(err.message || "Error al confirmar turno");
  }
}

export async function rechazarTurno(idTurno) {
  try {
    const token = localStorage.getItem("demo_token");
    const response = await apiFetch(`/admin/rechazarTurno?idTurno=${encodeURIComponent(idTurno)}`, {
      method: "POST",
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    });
    return checkError(response);
  } catch (err) {
    throw new Error(err.message || "Error al rechazar turno");
  }
}

export async function crearNuevoServicio({ nombre, precio }) {
  try {
    const response = await apiFetch("/admin/nuevoServicio", {
      method: "POST",
      body: { 
        nombreServicio: nombre, 
        precioServicio: precio 
      },
    });
    return checkError(response);
  } catch (err) {
    throw new Error(err.message || "Error al crear el servicio");
  }
}

export async function editarPrecioServicio({ idServicio, precio }) {
  try {
    const response = await apiFetch("/admin/editarPrecio", {
      method: "POST",
      body: { 
        idServicio, 
        precio 
      },
    });
    return checkError(response);
  } catch (err) {
    throw new Error(err.message || "Error al editar el precio");
  }
}

export async function toggleServicioDisponible(idServicio) {
  try {
    const response = await apiFetch(`/admin/servicioDisponible?idServicio=${encodeURIComponent(idServicio)}`, {
      method: "POST",
    });
    return checkError(response);
  } catch (err) {
    throw new Error(err.message || "Error al cambiar disponibilidad");
  }
}

export async function obtenerEstadoDias() {
  try {
    const response = await apiFetch("/admin/estadoDias", {
      method: "GET",
    });
    return checkError(response);
  } catch (err) {
    throw new Error(err.message || "Error al obtener estado de días");
  }
}

export async function editarEstadoDia(idDia) {
  try {
    const response = await apiFetch(`/admin/editarEstadoDia?idDia=${encodeURIComponent(idDia)}`, {
      method: "POST",
    });
    return checkError(response);
  } catch (err) {
    throw new Error(err.message || "Error al editar estado del día");
  }
}

export async function obtenerRangosDia() {
  try {
    const response = await apiFetch("/admin/obtenerRangosDia", {
      method: "GET",
    });
    return checkError(response);
  } catch (err) {
    throw new Error(err.message || "Error al obtener rangos de días");
  }
}

export async function crearDisponibilidad(idDia, { horaInicio, horaFin }) {
  try {
    const response = await apiFetch(`/admin/crearDisponibilidad?idDia=${encodeURIComponent(idDia)}`, {
      method: "POST",
      body: { horaInicio, horaFin },
    });
    return checkError(response);
  } catch (err) {
    throw new Error(err.message || "Error al crear disponibilidad");
  }
}

export async function borrarRango(idRango) {
  try {
    const response = await apiFetch(`/admin/borrarRango?idRango=${encodeURIComponent(idRango)}`, {
      method: "DELETE",
    });
    return checkError(response);
  } catch (err) {
    throw new Error(err.message || "Error al borrar rango");
  }
}

export async function subirImagenGaleria(formData) {
  try {
    const token = localStorage.getItem("demo_token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    
    // Usamos fetch directamente para evitar que apiFetch fuerce Content-Type: application/json
    // No establecemos Content-Type explícitamente; el navegador lo hará con el boundary correcto para FormData
    const BASE_URL = "http://localhost:8080";

    const res = await fetch(`${BASE_URL}/Admin/galeria/subirGaleria`, {
      method: "POST",
      body: formData,
      headers
    });

    const text = await res.text();
    
    if (!res.ok) {
      throw new Error(text || "Error al subir imagen");
    }

    return { success: true, message: text };
  } catch (err) {
    return { error: err.message || "Error al subir imagen" };
  }
}

export async function obtenerGaleria() {
  try {
    const response = await apiFetch("/auth/vistaGaleria/obtenerGaleria", {
      method: "GET",
    });
    return checkError(response);
  } catch (err) {
    throw new Error(err.message || "Error al obtener galería");
  }
}
