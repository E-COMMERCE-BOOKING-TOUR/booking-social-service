import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article, ArticleDocument } from '../schema/article.schema';
import { Comment, CommentDocument } from '../schema/comment.schema';
import { ArticleDTO } from '../dto/article.dto';

@Injectable()
export class ArticleService {
    constructor(
        @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
        @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    ) { }

    async create(dto: ArticleDTO): Promise<Article> {
        const createdArticle = new this.articleModel({
            ...dto,
            images: dto.images || [],
            created_at: new Date(),
            updated_at: new Date(),
        });
        return createdArticle.save();
    }

    async findAll(): Promise<Article[]> {
        return this.articleModel.find({ is_visible: true }).sort({ created_at: -1 }).exec();
    }

    async findOne(id: string): Promise<Article | null> {
        return this.articleModel.findById(id).exec();
    }

    async findByUser(userId: number): Promise<Article[]> {
        return this.articleModel.find({ user_id: userId }).sort({ created_at: -1 }).exec();
    }

    async update(id: string, dto: Partial<ArticleDTO>): Promise<Article | null> {
        return this.articleModel.findByIdAndUpdate(id, { ...dto, updated_at: new Date() }, { new: true }).exec();
    }

    async remove(id: string): Promise<boolean> {
        const result = await this.articleModel.findByIdAndDelete(id).exec();
        return !!result;
    }

    async like(articleId: string, userId: number): Promise<boolean> {
        const article = await this.articleModel.findById(articleId);
        if (!article) return false;
        if (!article.users_like.includes(userId)) {
            article.users_like.push(userId);
            article.count_likes++;
            await article.save();
        }
        return true;
    }

    async unlike(articleId: string, userId: number): Promise<boolean> {
        const article = await this.articleModel.findById(articleId);
        if (!article) return false;
        const index = article.users_like.indexOf(userId);
        if (index > -1) {
            article.users_like.splice(index, 1);
            article.count_likes = Math.max(0, article.count_likes - 1);
            await article.save();
        }
        return true;
    }

    async addComment(dto: any): Promise<Comment> {
        const comment = new this.commentModel({
            ...dto,
            created_at: new Date(),
            updated_at: new Date(),
        });
        await comment.save();

        // Update article comment count
        await this.articleModel.findByIdAndUpdate(dto.article_id, { $inc: { count_comments: 1 } });

        return comment;
    }

    async getPopularArticles(limit: number): Promise<Article[]> {
        return this.articleModel.find({ is_visible: true }).sort({ created_at: -1 }).limit(limit).exec();
    }
}
