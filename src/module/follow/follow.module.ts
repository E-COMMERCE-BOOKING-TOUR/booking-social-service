import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Follow, FollowSchema } from './schema/follow.schema';
import { FollowService } from './service/follow.service';
import { FollowController } from './controller/follow.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Follow.name, schema: FollowSchema }]),
    ],
    providers: [FollowService],
    controllers: [FollowController],
    exports: [FollowService],
})
export class FollowModule { }
