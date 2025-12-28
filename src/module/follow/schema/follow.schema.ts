import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FollowDocument = HydratedDocument<Follow>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Follow {
    @Prop({ required: true, index: true })
    follower_id: number;

    @Prop({ required: true, index: true })
    following_id: number;

    @Prop()
    created_at: Date;

    @Prop()
    updated_at: Date;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);
// Ensure uniqueness for follow pairs
FollowSchema.index({ follower_id: 1, following_id: 1 }, { unique: true });
