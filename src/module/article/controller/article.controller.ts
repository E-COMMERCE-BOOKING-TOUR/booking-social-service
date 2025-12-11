import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ArticleService } from '../service/article.service';
import { ArticleDTO } from '../dto/article.dto';

@Controller()
export class ArticleController {
    constructor(private readonly articleService: ArticleService) { }

    @MessagePattern('create_article')
    async create(@Payload() dto: ArticleDTO) {
        return this.articleService.create(dto);
    }

    @MessagePattern('get_all_articles')
    async findAll() {
        return this.articleService.findAll();
    }

    @MessagePattern('get_article_by_id')
    async findOne(@Payload() id: string) {
        return this.articleService.findOne(id);
    }

    @MessagePattern('get_articles_by_user')
    async findByUser(@Payload() userId: number) {
        return this.articleService.findByUser(userId);
    }

    @MessagePattern('update_article')
    async update(@Payload() data: { id: string, dto: Partial<ArticleDTO> }) {
        return this.articleService.update(data.id, data.dto);
    }

    @MessagePattern('remove_article')
    async remove(@Payload() id: string) {
        return this.articleService.remove(id);
    }

    @MessagePattern('like_article')
    async like(@Payload() data: { articleId: string, userId: number }) {
        return this.articleService.like(data.articleId, data.userId);
    }

    @MessagePattern('unlike_article')
    async unlike(@Payload() data: { articleId: string, userId: number }) {
        return this.articleService.unlike(data.articleId, data.userId);
    }

    @MessagePattern('add_comment')
    async addComment(@Payload() dto: any) {
        return this.articleService.addComment(dto);
    }

    @MessagePattern('get_popular_articles')
    async getPopularArticles(@Payload() limit: number) {
        return this.articleService.getPopularArticles(limit);
    }
}
