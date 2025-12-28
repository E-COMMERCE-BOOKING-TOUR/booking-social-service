import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FollowService } from '../service/follow.service';

@Controller()
export class FollowController {
    constructor(private readonly followService: FollowService) { }

    @MessagePattern('follow_user')
    async follow(@Payload() data: { followerId: number; followingId: number }) {
        return this.followService.follow(data.followerId, data.followingId);
    }

    @MessagePattern('unfollow_user')
    async unfollow(@Payload() data: { followerId: number; followingId: number }) {
        return this.followService.unfollow(data.followerId, data.followingId);
    }

    @MessagePattern('get_following_ids')
    async getFollowingIds(@Payload() followerId: number) {
        return this.followService.getFollowingIds(followerId);
    }

    @MessagePattern('get_follower_ids')
    async getFollowerIds(@Payload() followingId: number) {
        return this.followService.getFollowerIds(followingId);
    }
}
