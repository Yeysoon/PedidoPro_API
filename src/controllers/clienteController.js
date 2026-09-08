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
        const { nit_documento, nombre_completo } = req.body;
        if (!nombre_completo || !nombre_completo.trim()) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }
        
        const result = await clienteModel.createCliente({ nit_documento, nombre_completo });
        const id_cliente = (result && typeof result === 'object') ? result.id_cliente : result;
        const isExisting = result && result.existing;

        res.status(201).json({ 
            message: isExisting ? 'Cliente asignado correctamente' : 'Cliente registrado exitosamente', 
            id_cliente: id_cliente 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El NIT o documento ya está registrado' });
        }
        res.status(500).json({ message: 'Error al crear cliente: ' + (error.message || '') });
    }
};

const updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nit_documento, nombre_completo } = req.body;
        if (!nombre_completo || !nombre_completo.trim()) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }
        await clienteModel.updateCliente(id, { nit_documento, nombre_completo });
        res.json({ message: 'Cliente actualizado' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El NIT o documento ya está registrado' });
        }
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
