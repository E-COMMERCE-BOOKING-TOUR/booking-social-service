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
    async findByUser(@Payload() userId: string) {
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
    async like(@Payload() data: { articleId: string, userId: string }) {
        return this.articleService.like(data.articleId, data.userId);
    }

    @MessagePattern('unlike_article')
    async unlike(@Payload() data: { articleId: string, userId: string }) {
        return this.articleService.unlike(data.articleId, data.userId);
    }

    @MessagePattern('add_comment')
    async addComment(@Payload() dto: any) {
        return this.articleService.addComment(dto);
    }

    @MessagePattern('get_popular_articles')
    async getPopularArticles(@Payload() data: { limit: number, page?: number }) {
        return await this.articleService.getPopularArticles(data.limit, data.page);
    }

    @MessagePattern('get_articles_by_tag')
    async findByTag(@Payload() data: { tag: string, limit: number, page?: number }) {
        return this.articleService.findByTag(data.tag, data.limit, data.page);
    }

    @MessagePattern('get_articles_by_user')
    async findArticlesByUser(@Payload() userId: string) {
        return this.articleService.findByUser(userId);
    }

    @MessagePattern('get_articles_liked_by_user')
    async findLikedByUser(@Payload() userId: string) {
        return this.articleService.findLikedByUser(userId);
    }

    @MessagePattern('get_trending_tags')
    async getTrendingTags(@Payload() limit: number) {
        return this.articleService.getTrendingTags(limit);
    }

    @MessagePattern('get_following_articles')
    async findByFollowing(@Payload() data: { userIds: number[], limit: number, page?: number }) {
        return this.articleService.findByFollowing(data.userIds, data.limit, data.page);
    }

    @MessagePattern('bookmark_article')
    async bookmark(@Payload() data: { articleId: string, userId: string }) {
        return this.articleService.bookmark(data.articleId, data.userId);
    }

    @MessagePattern('unbookmark_article')
    async unbookmark(@Payload() data: { articleId: string, userId: string }) {
        return this.articleService.unbookmark(data.articleId, data.userId);
    }

    @MessagePattern('get_bookmarked_articles')
    async getBookmarkedArticles(@Payload() data: { userId: string, limit: number, page?: number }) {
        return this.articleService.getBookmarkedArticles(data.userId, data.limit, data.page);
    }

}
