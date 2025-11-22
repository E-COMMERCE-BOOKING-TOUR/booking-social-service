import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class ArticleService {
    constructor() { }

    async create(dto: any) {
        console.log(dto);
        return dto;
    }

    async findById(id: number) {
        console.log(id)
        return id;
    }
}