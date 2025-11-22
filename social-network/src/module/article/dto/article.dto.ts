import { IsArray, IsBoolean, IsDate, IsInt, IsNotEmpty, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ArticleImageDTO {
    @IsString()
    @IsNotEmpty()
    image_url: string;
}

export class ArticleDTO {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    title: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    content: string;

    @IsOptional()
    @IsBoolean()
    is_visible?: boolean;

    @IsInt()
    @Min(1)
    user_id: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ArticleImageDTO)
    images?: ArticleImageDTO[];

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
