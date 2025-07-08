import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

interface ContactRequestBody {
  nombre: string;
  email: string;
  mensaje: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { nombre, email, mensaje } = req.body as Partial<ContactRequestBody>;

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  try {
    // Instanciar Resend con la API Key almacenada en variables de entorno
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Construir una plantilla de correo más acorde al estilo del sitio
    const html = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Nueva consulta – Spa Sentirse Bien</title>
        </head>
        <body style="font-family:Arial,Helvetica,sans-serif;background:#F5F9F8;margin:0;padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F9F8;padding:24px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.05);">
                  <tr>
                    <td style="background:#436E6C;color:#ffffff;padding:16px 24px;">
                      <h1 style="margin:0;font-size:20px;">Spa Sentirse Bien</h1>
                      <p style="margin:0;font-size:12px;opacity:0.8;">Bienestar &amp; Relax</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 24px;">
                      <h2 style="margin-top:0;color:#333333;font-size:18px;">Nueva consulta recibida</h2>
                      <p style="font-size:14px;color:#555;">Se ha recibido una nueva consulta a través del formulario de contacto.</p>

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;font-size:14px;color:#333;">
                        <tr>
                          <td style="padding:8px 0;width:120px;">Nombre:</td>
                          <td style="padding:8px 0;">${nombre}</td>
                        </tr>
                        <tr style="border-top:1px solid #e5e5e5;">
                          <td style="padding:8px 0;">Email:</td>
                          <td style="padding:8px 0;"><a href="mailto:${email}" style="color:#436E6C;">${email}</a></td>
                        </tr>
                        <tr style="border-top:1px solid #e5e5e5;">
                          <td style="padding:8px 0;vertical-align:top;">Mensaje:</td>
                          <td style="padding:8px 0;">${mensaje.replace(/\n/g, '<br/>')}</td>
                        </tr>
                      </table>

                      <p style="font-size:12px;color:#777;line-height:1.6;">Este mensaje fue enviado automáticamente desde el sitio web. Por favor, no respondas directamente a este correo.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>`;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Spa Sentirse Bien <no-reply@resend.dev>',
      to: ['teorisso@gmail.com'],
      subject: 'Nueva consulta en Spa Sentirse Bien',
      html,
      reply_to: email,
    });

    return res.status(200).json({ message: 'Consulta enviada correctamente' });
  } catch (error) {
    console.error('Error enviando correo de consulta:', error);
    return res
      .status(500)
      .json({ message: 'Error interno al enviar la consulta' });
  }
} 