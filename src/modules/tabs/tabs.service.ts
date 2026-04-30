import Tab from "./tabs.model.js";
import type {
    ICreateTabDTO,
    IUpdateTabDTO
} from "./tabs.types.js";

class TabService {

    public async create(data: ICreateTabDTO) {
        const tab = await Tab.create({
            name: data.name,
            orders: data.orders ?? [],
            status: data.status
        });

        return tab;
    }

    public async get() {
        return Tab.find();
    }

    public async getById(id: string) {
        return Tab.findById(id);
    }

    public async update(id: string, data: IUpdateTabDTO) {
        return Tab.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
    }

    public async delete(id: string) {
        return Tab.findByIdAndDelete(id);
    }
}

export default new TabService();