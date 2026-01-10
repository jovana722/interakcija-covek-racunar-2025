import { UserModel } from '../models/user.model';
import { ToyOrderModel } from '../models/order.model';

export class UserService {
    public static USERS_KEY = 'icr_users'
    public static ACTIVE_KEY = 'icr_active'
    public static TO_KEY = 'icr_to'

    static getUsers(): UserModel[] {
        if (!localStorage.getItem(this.USERS_KEY)) {
            localStorage.setItem(this.USERS_KEY, JSON.stringify([
                {
                    firstName: "Jovana",
                    lastName: "Milicevic",
                    email: "jovana@gmail.com",
                    phone: "+38169321321",
                    password: "jovana",
                    orders: []
                }
            ]))
        }

        return JSON.parse(localStorage.getItem(this.USERS_KEY)!)
    }

    static findUserByEmail(email: string) {
        const users = this.getUsers()
        const selectedUser = users.find(u => u.email === email)

        if (!selectedUser)
            throw new Error('USER_NOT_FOUND')

        return selectedUser
    }

    static login(email: string, password: string) {
        try {
            const user = this.findUserByEmail(email)
            if (user.password === password) {
                localStorage.setItem(this.ACTIVE_KEY, user.email)
                return true
            }
            return false
        } catch {
            return false
        }
    }

    static hasAuth() {
        return localStorage.getItem(this.ACTIVE_KEY) !== null
    }

    static getActiveUser() {
        if (!this.hasAuth())
            throw new Error()

        return this.findUserByEmail(localStorage.getItem(this.ACTIVE_KEY)!)
    }

    static logout() {
        localStorage.removeItem(this.ACTIVE_KEY)
    }

    static updateUserData(updatedUser: UserModel) {
        const users = this.getUsers();
        const email = updatedUser.email;

        const updatedUsers = users.map(u =>
            u.email === email ? updatedUser : u
        );

        localStorage.setItem(this.USERS_KEY, JSON.stringify(updatedUsers));
    }





    static addOrder(order: ToyOrderModel) {
        const users = this.getUsers();
        const email = localStorage.getItem(this.ACTIVE_KEY)!;

        const updatedUsers = users.map(u =>
            u.email === email
                ? { ...u, orders: [...u.orders, order] }
                : u
        );

        localStorage.setItem(this.USERS_KEY, JSON.stringify(updatedUsers));
    }

    static updateOrderStatus(
        orderId: string,
        status: 'paid' | 'canceled' 
    ) {
        const users = this.getUsers();
        const email = localStorage.getItem(this.ACTIVE_KEY)!;

        const updatedUsers = users.map(u => {
            if (u.email !== email) return u;

            return {
                ...u,
                orders: u.orders.map(o =>
                    o.orderId === orderId ? { ...o, status } : o
                )
            };
        });

        localStorage.setItem(this.USERS_KEY, JSON.stringify(updatedUsers));
    }

    static getOrdersForActiveUser(): ToyOrderModel[] {
        return this.getActiveUser().orders;
    }
}
