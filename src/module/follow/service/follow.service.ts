import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Follow, FollowDocument } from '../schema/follow.schema';

@Injectable()
export class FollowService {
    constructor(
        @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    ) { }

    async follow(followerId: number, followingId: number): Promise<Follow> {
        if (followerId === followingId) {
            throw new Error('Cannot follow yourself');
        }
        return this.followModel.findOneAndUpdate(
            { follower_id: followerId, following_id: followingId },
            { follower_id: followerId, following_id: followingId },
            { upsert: true, new: true },
        );
    }

    async unfollow(followerId: number, followingId: number): Promise<any> {
        return this.followModel.deleteOne({ follower_id: followerId, following_id: followingId });
    }

    async getFollowingIds(followerId: number): Promise<number[]> {
        const follows = await this.followModel.find({ follower_id: followerId }).select('following_id').lean();
        return follows.map(f => f.following_id);
    }

    async getFollowerIds(followingId: number): Promise<number[]> {
        const follows = await this.followModel.find({ following_id: followingId }).select('follower_id').lean();
        return follows.map(f => f.follower_id);
    }
}
