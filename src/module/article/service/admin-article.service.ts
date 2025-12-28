import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article, ArticleDocument } from '../schema/article.schema';

@Injectable()
export class AdminArticleService {
    constructor(
        @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    ) { }

    async findAll(limit: number = 20, page: number = 1, filter: any = {}) {
        const skip = (page - 1) * limit;
        const query: any = {};

        if (filter.search) {
            query.$or = [
                { title: { $regex: filter.search, $options: 'i' } },
                { content: { $regex: filter.search, $options: 'i' } }
            ];
        }

        if (filter.is_visible !== undefined) {
            query.is_visible = filter.is_visible;
        }

        if (filter.user_id) {
            query.user_id = filter.user_id;
        }

        const [items, total] = await Promise.all([
            this.articleModel.find(query)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.articleModel.countDocuments(query).exec()
        ]);

        return {
            items,
            total,
            page,
            limit
        };
    }

    async delete(id: string) {
        return this.articleModel.findByIdAndDelete(id).exec();
    }

    async toggleVisibility(id: string) {
        const article = await this.articleModel.findById(id);
        if (!article) return null;

        article.is_visible = !article.is_visible;
        return article.save();
    }

    async getStats() {
        const [totalArticles, stats] = await Promise.all([
            this.articleModel.countDocuments().exec(),
            this.articleModel.aggregate([
                {
                    $group: {
                        _id: null,
                        totalLikes: { $sum: '$count_likes' },
                        totalComments: { $sum: '$count_comments' },
                        totalViews: { $sum: '$count_views' }
                    }
                }
            ]).exec()
        ]);

        const result = stats[0] || { totalLikes: 0, totalComments: 0, totalViews: 0 };

        return {
            totalArticles,
            ...result
        };
    }
}
