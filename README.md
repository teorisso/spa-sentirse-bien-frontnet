**Requerimientos Funcionales**

1. **Gestión de usuarios y roles**

   * Soporte para tres tipos de usuario con permisos diferenciados: Cliente, Profesional y Administrador.

2. **Registro y autenticación**

   * Registro e inicio de sesión con credenciales seguras para cada rol.

3. **Gestión de servicios**

   * Crear/editar/eliminar servicios con nombre, categoría, descripción e imagen.

4. **Programación de turnos**

   * El administrador asigna horarios y profesionales a cada servicio.

5. **Reserva de turnos online**

   * Clientes reservan hasta 48 h antes; confirmación en tiempo real.

6. **Integración de pagos**

   * Pago con tarjeta de débito, descuento del 15 % si se paga > 48 h antes; pagos agrupados por día.

7. **Notificaciones por email**

   * Envío automático de comprobante de pago.

8. **Consulta e impresión de agenda**

   * Profesionales consultan e imprimen la agenda diaria.

9. **Reportes y listados**

   * Listado de turnos por día y reporte de ingresos por servicio/profesional en rango de fechas.

10. **Persistencia en base de datos**

    * Todas las operaciones actualizan inmediatamente la base de datos.

11. **Validación y mensajes**

    * Feedback claro de errores y confirmaciones.

12. **Despliegue**

    * Operativa en URL pública bajo servidor web.

13. **Perfil del Profesional**

    * Ver turnos del día.
    * Registrar en el historial del cliente qué acción o tratamiento se realizó.
    * Consultar el historial completo de cada cliente.

14. **Perfil del Administrador**

    * Dar de alta o baja usuarios y asignarles/eliminarles un rol determinado.

15. **ChatBot en página de inicio**

    * Integrar un ChatBot para atención y orientación automática de visitantes.

---

**Requerimientos No Funcionales**

* Usabilidad amigable
* Diseño coherente con imagen corporativa
* Responsive Design
* Rendimiento: páginas críticas < 1 s
* Seguridad y cifrado de datos sensibles
