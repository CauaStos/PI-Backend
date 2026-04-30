import Order from "./orders.model.js";
import type {
    ICreateOrderDTO,
    IUpdateOrderDTO
} from "./orders.types.js";

class OrderService {

    public async create(data: ICreateOrderDTO) {
        const order = await Order.create({
            products: data.products,
            total: data.total,
            status: data.status
        });

        return order;
    }

    public async get() {
        return Order.find();
    }

    public async getById(id: string) {
        return Order.findById(id);
    }

    public async update(id: string, data: IUpdateOrderDTO) {
        return Order.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
    }

    public async delete(id: string) {
        return Order.findByIdAndDelete(id);
    }
}

export default new OrderService();