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

    async findByUser(userId: string): Promise<Article[]> {
        return this.articleModel.find({ user_id: userId }).sort({ created_at: -1 }).exec();
    }

    async findLikedByUser(userId: string): Promise<Article[]> {
        return this.articleModel.find({ users_like: userId, is_visible: true }).sort({ created_at: -1 }).exec();
    }

    async update(id: string, dto: Partial<ArticleDTO>): Promise<Article | null> {
        return this.articleModel.findByIdAndUpdate(id, { ...dto, updated_at: new Date() }, { new: true }).exec();
    }

    async remove(id: string): Promise<boolean> {
        const result = await this.articleModel.findByIdAndDelete(id).exec();
        return !!result;
    }

    async like(articleId: string, userId: string): Promise<boolean> {
        console.log('[ArticleService.like] Called with:', { articleId, userId });
        const result = await this.articleModel.findByIdAndUpdate(
            articleId,
            {
                $addToSet: { users_like: userId },
                $inc: { count_likes: 1 }
            },
            { new: true }
        );
        console.log('[ArticleService.like] Result:', result ? 'found' : 'not found');
        if (!result) {
            throw new Error(`Article not found: ${articleId}`);
        }
        return true;
    }

    async unlike(articleId: string, userId: string): Promise<boolean> {
        const result = await this.articleModel.findByIdAndUpdate(
            articleId,
            {
                $pull: { users_like: userId },
                $inc: { count_likes: -1 }
            },
            { new: true }
        );
        if (result && result.count_likes < 0) {
            await this.articleModel.findByIdAndUpdate(articleId, { count_likes: 0 });
        }
        return !!result;
    }

    async bookmark(articleId: string, userId: string): Promise<boolean> {
        const result = await this.articleModel.findByIdAndUpdate(
            articleId,
            { $addToSet: { users_bookmark: userId } },
            { new: true }
        );
        return !!result;
    }

    async unbookmark(articleId: string, userId: string): Promise<boolean> {
        const result = await this.articleModel.findByIdAndUpdate(
            articleId,
            { $pull: { users_bookmark: userId } },
            { new: true }
        );
        return !!result;
    }

    async getBookmarkedArticles(userId: string, limit: number = 10, page: number = 1): Promise<Article[]> {
        const skip = (page - 1) * limit;
        return this.articleModel.find({ users_bookmark: userId, is_visible: true })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
    }

    async addComment(dto: any): Promise<Comment> {
        console.log('[addComment] Received dto:', JSON.stringify(dto));
        const comment = new this.commentModel({
            ...dto,
            created_at: new Date(),
            updated_at: new Date(),
        });
        await comment.save();
        console.log('[addComment] Saved comment:', JSON.stringify(comment.toObject()));

        // Update article comment count
        await this.articleModel.findByIdAndUpdate(dto.article_id, { $inc: { count_comments: 1 } });

        return comment;
    }

    async getPopularArticles(limit: number, page: number = 1) {
        const skip = (page - 1) * limit;
        const result = await this.articleModel.aggregate([
            { $match: { is_visible: true } },
            {
                $addFields: {
                    trending_score: {
                        $add: [
                            { $multiply: ["$count_likes", 5] },
                            { $multiply: ["$count_comments", 10] },
                            { $multiply: ["$count_views", 1] }
                        ]
                    }
                }
            },
            { $sort: { trending_score: -1, created_at: -1 } },
            { $skip: skip },
            { $limit: limit },
            // Join comments from comments collection
            {
                $lookup: {
                    from: 'comments',
                    let: { articleId: { $toString: '$_id' } },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$article_id', '$$articleId'] } } },
                        { $sort: { created_at: 1 } }
                    ],
                    as: 'comments'
                }
            }
        ]).exec();
        console.log('[getPopularArticles] First article users_like:', result[0]?.users_like);
        console.log('[getPopularArticles] First article comments count:', result[0]?.comments?.length);
        return result;
    }

    async findByFollowing(userIds: number[], limit: number, page: number = 1): Promise<Article[]> {
        const skip = (page - 1) * limit;
        // Convert number[] to string[] for user_id matching, filter out null/undefined
        const userIdStrings = userIds.filter(id => id != null).map(id => id.toString());
        if (userIdStrings.length === 0) return [];
        return this.articleModel.aggregate([
            { $match: { user_id: { $in: userIdStrings }, is_visible: true } },
            { $sort: { created_at: -1 } },
            { $skip: skip },
            { $limit: limit },
            // Join comments from comments collection
            {
                $lookup: {
                    from: 'comments',
                    let: { articleId: { $toString: '$_id' } },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$article_id', '$$articleId'] } } },
                        { $sort: { created_at: 1 } }
                    ],
                    as: 'comments'
                }
            }
        ]).exec();
    }

    async findByTag(tag: string, limit: number, page: number = 1): Promise<Article[]> {
        const skip = (page - 1) * limit;
        return this.articleModel.find({ tags: tag, is_visible: true })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
    }

    async getTrendingTags(limit: number): Promise<{ _id: string, count: number }[]> {
        return this.articleModel.aggregate([
            { $match: { is_visible: true } },
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]).exec();
    }

    /**
     * Update user name across all articles and comments
     * @deprecated Use syncUserInfo instead
     */
    async updateUserName(userId: string, name: string): Promise<{ articlesUpdated: number; commentsUpdated: number }> {
        return this.syncUserInfo(userId, name);
    }

    /**
     * Sync user info (name, avatar) across all articles and comments
     */
    async syncUserInfo(userId: string, name?: string, avatar?: string): Promise<{ articlesUpdated: number; commentsUpdated: number }> {
        console.log(`[syncUserInfo] Syncing info for user ${userId}: name="${name}", avatar="${avatar}"`);

        const updateData: any = {};
        if (name) updateData['user.name'] = name;
        if (avatar) updateData['user.avatar'] = avatar;

        if (Object.keys(updateData).length === 0) {
            return { articlesUpdated: 0, commentsUpdated: 0 };
        }

        // Update all articles by this user
        const articleResult = await this.articleModel.updateMany(
            { user_id: userId },
            { $set: updateData }
        );

        // Update all comments by this user
        const commentResult = await this.commentModel.updateMany(
            { user_id: userId.toString() },
            { $set: updateData }
        );

        const result = {
            articlesUpdated: articleResult.modifiedCount,
            commentsUpdated: commentResult.modifiedCount
        };

        console.log(`[syncUserInfo] Updated ${result.articlesUpdated} articles and ${result.commentsUpdated} comments for user ${userId}`);
        return result;
    }
}
