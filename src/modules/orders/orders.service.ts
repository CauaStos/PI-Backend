import { AppError } from "../../shared/app-error.js";
import { isTabOpen, STATUS } from "../../shared/status.js";
import Employee from "../employees/employees.model.js";
import Product from "../products/products.model.js";
import Tab from "../tabs/tabs.model.js";
import Order from "./orders.model.js";
import type { ICreateOrderDTO, IUpdateOrderDTO } from "./orders.types.js";

class OrderService {
    private async getOpenTabOrThrow(tabId: string) {
        const tab = await Tab.findById(tabId);
        if (!tab) throw new AppError("Comanda nao encontrada.", 404);
        if (!isTabOpen(tab.status)) throw new AppError("Comanda nao esta aberta.", 409);
        return tab;
    }

    private async getProductOrThrow(productId: string) {
        const product = await Product.findById(productId);
        if (!product) throw new AppError("Produto nao encontrado.", 404);
        return product;
    }

    private async getEmployeeOrThrow(employeeId: string) {
        const employee = await Employee.findById(employeeId);
        if (!employee) throw new AppError("Funcionario nao encontrado.", 404);
        return employee;
    }

    public async create(data: ICreateOrderDTO) {
        const quantity = Number(data.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new AppError("Quantidade invalida.");
        }

        const tab = await this.getOpenTabOrThrow(data.tab);
        const product = await this.getProductOrThrow(data.product);
        const employee = await this.getEmployeeOrThrow(data.employee);

        if (product.stock < quantity) {
            throw new AppError("Quantidade maior que o estoque disponivel.", 409);
        }

        const order = await Order.create({
            tab: tab._id,
            product: product._id,
            productName: product.name,
            unitPrice: product.price,
            employee: employee._id,
            employeeName: employee.name,
            employeeAvatar: employee.avatar,
            quantity,
            status: STATUS.IN_PROGRESS,
            orderedAt: new Date(),
            deliveredAt: null,
        });

        product.stock -= quantity;
        await product.save();

        tab.orders.push(order._id);
        if (tab.status === STATUS.OPEN) tab.status = STATUS.IN_PROGRESS;
        await tab.save();

        return order;
    }

    public async get() {
        return Order.find().sort({ orderedAt: 1 });
    }

    public async getById(id: string) {
        return Order.findById(id);
    }

    public async update(id: string, data: IUpdateOrderDTO) {
        const order = await Order.findById(id);
        if (!order) throw new AppError("Pedido nao encontrado.", 404);

        await this.getOpenTabOrThrow(String(order.tab));

        const targetQuantity =
            data.quantity !== undefined ? Number(data.quantity) : order.quantity;

        if (data.quantity !== undefined) {
            if (!Number.isInteger(targetQuantity) || targetQuantity <= 0) {
                throw new AppError("Quantidade invalida.");
            }
        }

        const wantsProductChange =
            data.product !== undefined && data.product !== String(order.product);

        if (wantsProductChange) {
            const oldProduct = await this.getProductOrThrow(String(order.product));
            const newProduct = await this.getProductOrThrow(String(data.product));

            if (newProduct.stock < targetQuantity) {
                throw new AppError("Quantidade maior que o estoque disponivel.", 409);
            }

            oldProduct.stock += order.quantity;
            newProduct.stock -= targetQuantity;
            await oldProduct.save();
            await newProduct.save();

            order.product = newProduct._id;
            order.productName = newProduct.name;
            order.unitPrice = newProduct.price;
            order.quantity = targetQuantity;
        } else if (
            data.quantity !== undefined &&
            targetQuantity !== order.quantity
        ) {
            const product = await this.getProductOrThrow(String(order.product));
            const delta = targetQuantity - order.quantity;
            if (delta > 0 && product.stock < delta) {
                throw new AppError("Quantidade maior que o estoque disponivel.", 409);
            }
            product.stock -= delta;
            await product.save();
            order.quantity = targetQuantity;
        }

        if (
            data.employee !== undefined &&
            data.employee !== String(order.employee)
        ) {
            const employee = await this.getEmployeeOrThrow(data.employee);
            order.employee = employee._id;
            order.employeeName = employee.name;
            order.employeeAvatar = employee.avatar;
        }

        if (data.status !== undefined && data.status !== order.status) {
            order.status = data.status;
            if (
                data.status === STATUS.DELIVERED ||
                data.status === STATUS.FINISHED
            ) {
                order.deliveredAt = order.deliveredAt ?? new Date();
            }
            if (data.status === STATUS.IN_PROGRESS) {
                order.deliveredAt = null;
            }
        }

        await order.save();
        return order;
    }

    public async delete(id: string) {
        const order = await Order.findById(id);
        if (!order) throw new AppError("Pedido nao encontrado.", 404);

        const tab = await this.getOpenTabOrThrow(String(order.tab));

        if (order.status !== STATUS.CANCELLED) {
            const product = await Product.findById(order.product);
            if (product) {
                product.stock += order.quantity;
                await product.save();
            }
        }

        tab.orders = tab.orders.filter(
            (oid) => String(oid) !== String(order._id)
        );
        await tab.save();
        await order.deleteOne();
        return order;
    }
}

export default new OrderService();
