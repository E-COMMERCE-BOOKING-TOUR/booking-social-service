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
            is_visible: true, // Make post visible immediately
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
        return this.articleModel.aggregate([
            { $match: { user_id: userId } },
            { $sort: { created_at: -1 } },
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

    async findLikedByUser(userId: string): Promise<Article[]> {
        return this.articleModel.aggregate([
            { $match: { users_like: userId, is_visible: true } },
            { $sort: { created_at: -1 } },
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
        const now = new Date();
        const result = await this.articleModel.aggregate([
            { $match: { is_visible: true } },
            {
                $addFields: {
                    // Calculate age in hours
                    age_hours: {
                        $divide: [
                            { $subtract: [now, "$created_at"] },
                            1000 * 60 * 60 // milliseconds to hours
                        ]
                    }
                }
            },
            {
                $addFields: {
                    // Recency boost: new posts (< 24h) get 100 points, decreasing with age
                    recency_boost: {
                        $max: [0, { $subtract: [100, { $multiply: ["$age_hours", 2] }] }]
                    },
                    trending_score: {
                        $add: [
                            { $multiply: [{ $ifNull: ["$count_likes", 0] }, 5] },
                            { $multiply: [{ $ifNull: ["$count_comments", 0] }, 10] },
                            { $multiply: [{ $ifNull: ["$count_views", 0] }, 1] }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    final_score: { $add: ["$trending_score", "$recency_boost"] }
                }
            },
            { $sort: { final_score: -1, created_at: -1 } },
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

    /**
     * Explore algorithm - Discovery-focused content recommendation
     * Features:
     * 1. Personalization: Prioritize content from followed users
     * 2. Diversity: Limit articles per user to avoid feed domination
     * 3. Serendipity: Mix in random content for discovery
     * 4. Exclusion: Skip already liked/viewed articles
     */
    async getExploreArticles(
        limit: number,
        page: number = 1,
        userId?: string,
        followingUserIds?: string[],
        likedArticleIds?: string[],
        tourIds?: string[]
    ) {
        const skip = (page - 1) * limit;
        const now = new Date();

        // Build exclusion list
        const excludeIds = likedArticleIds?.map(id => {
            try { return new (require('mongoose').Types.ObjectId)(id); } catch { return null; }
        }).filter(Boolean) || [];

        // Pipeline stages
        const basePipeline: any[] = [
            {
                $match: {
                    is_visible: true,
                    ...(excludeIds.length > 0 ? { _id: { $nin: excludeIds } } : {}),
                    ...(tourIds?.length ? { tour_id: { $in: tourIds } } : {})
                }
            },
        ];

        // Calculate scores
        const scoringStage = {
            $addFields: {
                // Age in hours
                age_hours: {
                    $divide: [
                        { $subtract: [now, "$created_at"] },
                        1000 * 60 * 60
                    ]
                },
                // Check if from followed user
                is_from_following: followingUserIds?.length
                    ? { $in: ["$user_id", followingUserIds] }
                    : false,
            }
        };

        const calculateScores = {
            $addFields: {
                // Recency score: newer = higher (max 100, decays over 48h)
                recency_score: {
                    $max: [0, { $subtract: [100, { $multiply: ["$age_hours", 2] }] }]
                },
                // Engagement score
                engagement_score: {
                    $add: [
                        { $multiply: [{ $ifNull: ["$count_likes", 0] }, 3] },
                        { $multiply: [{ $ifNull: ["$count_comments", 0] }, 5] },
                        { $multiply: [{ $ifNull: ["$count_views", 0] }, 0.5] }
                    ]
                },
                // Following bonus (50 points if from followed user)
                following_bonus: {
                    $cond: ["$is_from_following", 50, 0]
                },
                // Random factor for serendipity (0-30 points)
                random_factor: { $multiply: [{ $rand: {} }, 30] }
            }
        };

        const finalScore = {
            $addFields: {
                explore_score: {
                    $add: [
                        "$recency_score",
                        "$engagement_score",
                        "$following_bonus",
                        "$random_factor"
                    ]
                }
            }
        };

        // Diversity: Group by user and limit per user
        const diversityPipeline = [
            { $sort: { explore_score: -1 } },
            {
                $group: {
                    _id: "$user_id",
                    articles: { $push: "$$ROOT" }
                }
            },
            {
                $project: {
                    articles: { $slice: ["$articles", 3] } // Max 3 articles per user
                }
            },
            { $unwind: "$articles" },
            { $replaceRoot: { newRoot: "$articles" } },
            { $sort: { explore_score: -1 } },
            { $skip: skip },
            { $limit: limit },
            // Join comments
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
        ];

        const result = await this.articleModel.aggregate([
            ...basePipeline,
            scoringStage,
            calculateScores,
            finalScore,
            ...diversityPipeline
        ]).exec();

        console.log(`[getExploreArticles] Returned ${result.length} articles for user ${userId || 'anonymous'}`);
        return result;
    }
}
