const clienteModel = require('../models/clienteModel');

const getClientes = async (req, res) => {
    try {
        const clientes = await clienteModel.getAllClientes();
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener clientes' });
    }
};

const getCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await clienteModel.getClienteById(id);
        if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });
        res.json(cliente);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener cliente' });
    }
};

const createCliente = async (req, res) => {
    try {
        const { nit_documento, nombre_completo, correo_electronico, telefono } = req.body;
        if (!nombre_completo) return res.status(400).json({ message: 'El nombre es obligatorio' });
        
        const id = await clienteModel.createCliente({ nit_documento, nombre_completo, correo_electronico, telefono });
        res.status(201).json({ message: 'Cliente registrado', id_cliente: id });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El NIT o documento ya está registrado' });
        }
        res.status(500).json({ message: 'Error al crear cliente' });
    }
};

const updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nit_documento, nombre_completo, correo_electronico, telefono } = req.body;
        await clienteModel.updateCliente(id, { nit_documento, nombre_completo, correo_electronico, telefono });
        res.json({ message: 'Cliente actualizado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar cliente' });
    }
};

const deleteCliente = async (req, res) => {
    try {
        const { id } = req.params;
        await clienteModel.deleteCliente(id);
        res.json({ message: 'Cliente eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar cliente' });
    }
};

module.exports = {
    getClientes,
    getCliente,
    createCliente,
    updateCliente,
    deleteCliente
};
