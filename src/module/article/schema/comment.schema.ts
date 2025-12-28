import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Comment {
    @Prop({ required: true })
    content: string;

    @Prop({ required: true, index: true })
    article_id: string;

    @Prop({ required: true })
    user_id: string;

    @Prop({ type: { name: String, avatar: String }, default: {} })
    user: { name: string; avatar: string };

    @Prop({ type: String, default: null })
    parent_id: string | null;

    @Prop()
    created_at: Date;

    @Prop()
    updated_at: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
