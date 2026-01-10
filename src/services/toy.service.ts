import { Injectable } from '@angular/core';
import axios from 'axios';
import { ToyModel } from '../models/toy.model';

@Injectable({ providedIn: 'root' })
export class ToyService {
  private client = axios.create({
    baseURL: 'https://toy.pequla.com/api',
    headers: {
      'Accept': 'application/json',
      'X-Name': 'ICR/2025'
    }
  });

  async getToys(): Promise<ToyModel[]> {
    const rsp = await this.client.get<ToyModel[]>('/toy');
    return rsp.data.map(toy => ({
      ...toy,
      imageUrl: `https://toy.pequla.com${toy.imageUrl}`
    }));
  }

  async getToyById(id: number): Promise<ToyModel> {
    const rsp = await this.client.get<ToyModel>(`/toy/${id}`);
    return {
      ...rsp.data,
      imageUrl: `https://toy.pequla.com${rsp.data.imageUrl}`
    };
  }

  async getToyByPermalink(permalink: string): Promise<ToyModel> {
    const rsp = await this.client.get<ToyModel>(`/toy/permalink/${permalink}`);
    return {
      ...rsp.data,
      imageUrl: `https://toy.pequla.com${rsp.data.imageUrl}`
    };
  }

  async getTypes(): Promise<string[]> {
    const rsp = await this.client.get<string[]>('/type');
    return rsp.data;
  }

  async getAgeGroups(): Promise<string[]> {
    const rsp = await this.client.get<string[]>('/age-group');
    return rsp.data;
  }
}
