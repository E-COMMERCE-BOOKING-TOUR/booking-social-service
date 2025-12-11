import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ArticleDocument = HydratedDocument<Article>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Article {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    content: string;

    @Prop({ default: 0 })
    count_views: number;

    @Prop({ default: 0 })
    count_likes: number;

    @Prop({ default: 0 })
    count_comments: number;

    @Prop({ default: false })
    is_visible: boolean;

    @Prop({ required: true, index: true })
    user_uuid: number;

    @Prop({ type: { name: String, avatar: String }, default: {} })
    user: { name: string; avatar: string };

    @Prop({ type: [Number], default: [] })
    users_like: number[];

    @Prop({ type: [{ image_url: String }], default: [] })
    images: { image_url: string }[];

    @Prop()
    created_at: Date;

    @Prop()
    updated_at: Date;

    @Prop()
    deleted_at: Date;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
