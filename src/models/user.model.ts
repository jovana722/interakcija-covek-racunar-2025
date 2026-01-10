import { ToyOrderModel } from "./order.model"

export interface UserModel {
    firstName: string
    lastName: string
    email: string
    phone: string
    password: string
    orders: ToyOrderModel[]
    favoriteCategory?: string;
}