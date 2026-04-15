
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, MinLength, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class LoginDto {

    @ApiProperty({
        example: "name@example.com",
        description: "user email",
        required: true
    })
    @IsEmail()
    @IsNotEmpty()
    email!: string;
 
    @ApiProperty({
        example: "name",
        description: "User name",
    })
    @IsString()
    @IsOptional()
    username!: string;

    @ApiProperty({
        example: "password123",
        description: "User password",
        required: true
    })
    @IsString()
    @IsNotEmpty()
    password!: string;
}