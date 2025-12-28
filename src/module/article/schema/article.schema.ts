import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ArticleDocument = HydratedDocument<Article>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Article {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    content: string;

    @Prop({ type: [String], default: [] })
    tags: string[];

    @Prop({ default: 0 })
    count_views: number;

    @Prop({ default: 0 })
    count_likes: number;

    @Prop({ default: 0 })
    count_comments: number;

    @Prop({ default: false })
    is_visible: boolean;

    @Prop({ required: true, index: true })
    user_id: string;

    @Prop({ type: [String], default: [] })
    users_like: string[];

    @Prop({ type: [String], default: [] })
    users_bookmark: string[];

    @Prop({ type: [{ image_url: String }], default: [] })
    images: { image_url: string }[];

    @Prop({ default: 1 })
    tour_id: number;

    @Prop({ type: [String], default: [] })
    comments: string[];

    @Prop()
    created_at: Date;

    @Prop()
    updated_at: Date;

    @Prop()
    deleted_at: Date;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
