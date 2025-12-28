import { IsArray, IsBoolean, IsDate, IsInt, IsNotEmpty, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ArticleImageDTO {
    @IsString()
    @IsNotEmpty()
    image_url: string;
}

export class ArticleCommentDTO {

    @IsInt()
    @IsNotEmpty()
    id: number;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsInt()
    @IsOptional()
    parent_id?: number;

    @IsString()
    @IsOptional()
    user_id?: string;

    @IsDate()
    @Type(() => Date)
    created_at?: Date;

    @IsDate()
    @Type(() => Date)
    updated_at?: Date;
}

export class ArticleDTO {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    title: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    content: string;

    @IsOptional()
    @IsBoolean()
    is_visible?: boolean;

    @IsOptional()
    @IsInt()
    tour_id?: number;

    @IsString()
    @IsNotEmpty()
    user_id: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ArticleImageDTO)
    images?: ArticleImageDTO[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ArticleCommentDTO)
    comments?: ArticleCommentDTO[];

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    created_at?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    updated_at?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    deleted_at?: Date;
}
