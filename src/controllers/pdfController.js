const PDFDocument = require('pdfkit');

const getFacturaPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const cajaModel = require('../models/cajaModel');
        const factura = await cajaModel.getFacturaById(id);
        
        if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });

        const doc = new PDFDocument({ margin: 30, size: [250, 600] }); // Formato ticket de rollo termico
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ticket-${id}.pdf`);
        
        doc.pipe(res);

        // Cabecera
        doc.fontSize(16).text('PEDIDO PRO', { align: 'center' });
        doc.fontSize(10).text('NIT: 12345678-9', { align: 'center' });
        doc.text('------------------------------------------', { align: 'center' });
        doc.moveDown(0.5);
        
        // Datos factura
        doc.fontSize(10).text(`Factura N°: ${factura.id_factura});
        doc.text(`Fecha: ${new Date(factura.fecha_hora_pago).toLocaleString()});
        doc.text(`Cajero: ${factura.cajero});
        doc.text(`Cliente: ${factura.cliente || 'Consumidor Final'});
        doc.moveDown(0.5);
        doc.text('------------------------------------------', { align: 'center' });
        doc.moveDown(0.5);

        // Productos
        doc.fontSize(10);
        factura.detalle_productos.forEach(p => {
            doc.text(`x   -  {p.subtotal}`);
        });
        
        doc.moveDown(0.5);
        doc.text('------------------------------------------', { align: 'center' });
        doc.moveDown(0.5);
        
        // Totales
        doc.text(`Subtotal: {factura.subtotal}`, { align: 'right' });
        doc.text(`Impuestos: {factura.impuestos}`, { align: 'right' });
        doc.text(`Propina: {factura.propina}`, { align: 'right' });
        doc.fontSize(12).text(`TOTAL: {factura.total_pagado}`, { align: 'right' });
        
        doc.moveDown(1);
        doc.fontSize(10).text('¡Gracias por su compra!', { align: 'center' });
        
        doc.end();

    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).json({ message: 'Error al generar ticket PDF' });
    }
};

module.exports = getFacturaPDF;
