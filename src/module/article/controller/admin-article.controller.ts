import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AdminArticleService } from '../service/admin-article.service';

@Controller()
export class AdminArticleController {
    constructor(private readonly adminArticleService: AdminArticleService) { }

    @MessagePattern('admin_get_articles')
    async findAll(@Payload() data: { limit?: number, page?: number, filter?: any }) {
        return this.adminArticleService.findAll(data.limit, data.page, data.filter);
    }

    @MessagePattern('admin_delete_article')
    async delete(@Payload() id: string) {
        return this.adminArticleService.delete(id);
    }

    @MessagePattern('admin_toggle_visibility')
    async toggleVisibility(@Payload() id: string) {
        return this.adminArticleService.toggleVisibility(id);
    }

    @MessagePattern('admin_get_social_stats')
    async getStats() {
        return this.adminArticleService.getStats();
    }
}
