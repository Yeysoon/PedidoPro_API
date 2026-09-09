const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const logoPath = path.join(__dirname, '../assets/logo.png');
let cachedLogoBuffer = null;
try {
    if (fs.existsSync(logoPath)) {
        cachedLogoBuffer = fs.readFileSync(logoPath);
    }
} catch (e) {
    cachedLogoBuffer = null;
}

const formatMoney = (val) => {
    return 'Q ' + (parseFloat(val) || 0).toFixed(2);
};

const formatFacturaNo = (id) => {
    return `FACPRO${String(id || 0).padStart(5, '0')}`;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('es-GT', {
        timeZone: 'America/Guatemala',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};

const getFacturaPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const cajaModel = require('../models/cajaModel');
        const factura = await cajaModel.getFacturaById(id);
        
        if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });

        const detalles = Array.isArray(factura.detalle_productos) ? factura.detalle_productos : [];
        
        // Calcular altura dinámica según la cantidad de productos
        const baseHeight = 490;
        const itemsHeight = detalles.length * 24;
        const totalHeight = Math.max(540, baseHeight + itemsHeight);

        const doc = new PDFDocument({ 
            margin: 14, 
            size: [260, totalHeight],
            autoFirstPage: true
        });
        
        const facProName = formatFacturaNo(factura.id_factura);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Factura_PedidoPro_${facProName}.pdf`);
        
        doc.pipe(res);

        const pageWidth = 260;
        const contentWidth = pageWidth - 28; // 232pt
        const startX = 14;

        // 1. Barra superior decorativa Esmeralda
        doc.rect(0, 0, pageWidth, 5).fill('#10B981');

        let currentY = 16;

        // 2. Logo si existe (usando el buffer en memoria)
        if (cachedLogoBuffer) {
            try {
                const logoSize = 36;
                const logoX = (pageWidth - logoSize) / 2;
                doc.image(cachedLogoBuffer, logoX, currentY, { width: logoSize, height: logoSize });
                currentY += logoSize + 4;
            } catch (err) {
                console.warn('No se pudo renderizar imagen de logo:', err.message);
            }
        }

        // 3. Título de Marca
        doc.font('Helvetica-Bold').fontSize(14);
        const text1 = 'PEDIDO';
        const text2 = 'PRO';
        const w1 = doc.widthOfString(text1);
        const w2 = doc.widthOfString(text2);
        const titleStartX = (pageWidth - (w1 + w2)) / 2;

        doc.fillColor('#0F172A').text(text1, titleStartX, currentY, { continued: true })
           .fillColor('#10B981').text(text2, { continued: false });
        currentY += 16;

        doc.font('Helvetica').fontSize(7.5).fillColor('#64748B')
           .text('Sistema Gastronómico & Restaurante', startX, currentY, { align: 'center', width: contentWidth });
        currentY += 10;

        doc.fontSize(7).fillColor('#94A3B8')
           .text('NIT: 9482715-3 · PBX: (502) 2345-6789', startX, currentY, { align: 'center', width: contentWidth });
        currentY += 12;

        // Línea divisora
        doc.strokeColor('#E2E8F0').lineWidth(0.8)
           .dash(3, { space: 2 })
           .moveTo(startX, currentY).lineTo(startX + contentWidth, currentY).stroke()
           .undash();
        currentY += 8;

        // 4. Badge Box de Factura / Mesa
        const badgeHeight = 22;
        doc.roundedRect(startX, currentY, contentWidth, badgeHeight, 4)
           .fillAndStroke('#F0FDF4', '#BBF7D0');

        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#059669')
           .text(facProName, startX + 8, currentY + 6, { width: 110, align: 'left' });

        doc.font('Helvetica-Bold').fontSize(8).fillColor('#1E293B')
           .text(`MESA ${factura.numero_mesa || '-'} · PEDIDO #${factura.id_pedido || '-'}`, startX + 110, currentY + 6, { width: contentWidth - 118, align: 'right' });

        currentY += badgeHeight + 8;

        // 5. Metadatos de la Factura (Grid 2 columnas)
        const renderMetaRow = (label, val) => {
            doc.font('Helvetica').fontSize(7.5).fillColor('#64748B')
               .text(label, startX, currentY, { width: 75, align: 'left' });
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1E293B')
               .text(val || '-', startX + 75, currentY, { width: contentWidth - 75, align: 'right' });
            currentY += 11;
        };

        renderMetaRow('Fecha / Hora:', formatDate(factura.fecha_hora_pago));
        renderMetaRow('Atendido por:', factura.mesero || 'Mesero');
        renderMetaRow('Cajero(a):', factura.cajero || 'Caja Principal');
        renderMetaRow('Cliente:', factura.cliente || 'Consumidor Final');
        renderMetaRow('NIT Cliente:', factura.cliente_nit || 'C/F');
        renderMetaRow('Método de Pago:', factura.metodo_pago || 'Efectivo');

        currentY += 4;

        // 6. Tabla de Productos (Encabezado)
        doc.rect(startX, currentY, contentWidth, 16).fill('#F8FAFC');
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#475569');
        doc.text('CANT', startX + 4, currentY + 4, { width: 28, align: 'left' });
        doc.text('DESCRIPCIÓN', startX + 32, currentY + 4, { width: 130, align: 'left' });
        doc.text('TOTAL', startX + 165, currentY + 4, { width: contentWidth - 169, align: 'right' });
        currentY += 18;

        // Línea debajo del encabezado
        doc.strokeColor('#CBD5E1').lineWidth(0.5)
           .moveTo(startX, currentY).lineTo(startX + contentWidth, currentY).stroke();
        currentY += 5;

        // Lista de platillos
        if (detalles.length === 0) {
            doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#94A3B8')
               .text('Sin detalle de productos', startX, currentY, { align: 'center', width: contentWidth });
            currentY += 14;
        } else {
            detalles.forEach((p, idx) => {
                const qty = p.cantidad || 1;
                const nombre = p.nombre_producto || p.nombre || 'Producto';
                const sub = p.subtotal || (qty * (p.precio_unitario_historico || 0));

                doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#059669')
                   .text(`${qty}x`, startX + 4, currentY, { width: 28, align: 'left' });

                doc.font('Helvetica').fontSize(7.5).fillColor('#1E293B')
                   .text(nombre, startX + 32, currentY, { width: 130, align: 'left', lineBreak: false });

                doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1E293B')
                   .text(formatMoney(sub), startX + 165, currentY, { width: contentWidth - 169, align: 'right' });

                currentY += 13;

                // Separador suave entre ítems excepto el último
                if (idx < detalles.length - 1) {
                    doc.strokeColor('#F1F5F9').lineWidth(0.5)
                       .moveTo(startX, currentY - 2).lineTo(startX + contentWidth, currentY - 2).stroke();
                }
            });
        }

        currentY += 4;
        doc.strokeColor('#E2E8F0').lineWidth(0.8)
           .dash(3, { space: 2 })
           .moveTo(startX, currentY).lineTo(startX + contentWidth, currentY).stroke()
           .undash();
        currentY += 8;

        // 7. Desglose de Totales
        const renderTotalRow = (label, val, isBold = false) => {
            doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5).fillColor(isBold ? '#1E293B' : '#64748B')
               .text(label, startX + 60, currentY, { width: 85, align: 'right' });
            doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5).fillColor('#1E293B')
               .text(formatMoney(val), startX + 145, currentY, { width: contentWidth - 149, align: 'right' });
            currentY += 11;
        };

        renderTotalRow('Subtotal Consumo:', factura.subtotal || 0);
        
        if (parseFloat(factura.propina) > 0) {
            renderTotalRow('Propina Voluntaria:', factura.propina, true);
        }

        currentY += 4;

        // Caja Destacada: TOTAL PAGADO
        const totalBoxHeight = 26;
        doc.roundedRect(startX, currentY, contentWidth, totalBoxHeight, 5)
           .fillAndStroke('#ECFDF5', '#10B981');

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#065F46')
           .text('TOTAL A PAGAR:', startX + 10, currentY + 8, { width: 100, align: 'left' });

        doc.font('Helvetica-Bold').fontSize(11).fillColor('#059669')
           .text(formatMoney(factura.total_pagado), startX + 110, currentY + 7, { width: contentWidth - 120, align: 'right' });

        currentY += totalBoxHeight + 14;

        // 8. Mensaje de Agradecimiento y Pie de Ticket
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0F172A')
           .text('¡Gracias por su preferencia!', startX, currentY, { align: 'center', width: contentWidth });
        currentY += 11;

        doc.font('Helvetica').fontSize(6.5).fillColor('#94A3B8')
           .text('Comprobante emitido electrónicamente por PedidoPro', startX, currentY, { align: 'center', width: contentWidth });
        currentY += 9;

        doc.font('Helvetica').fontSize(6).fillColor('#CBD5E1')
           .text('Conserve este comprobante para cualquier reclamo', startX, currentY, { align: 'center', width: contentWidth });
        currentY += 12;

        // Borde inferior decorativo
        doc.rect(0, totalHeight - 4, pageWidth, 4).fill('#10B981');

        doc.end();

    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).json({ message: 'Error al generar ticket PDF' });
    }
};

module.exports = {
    getFacturaPDF
};

