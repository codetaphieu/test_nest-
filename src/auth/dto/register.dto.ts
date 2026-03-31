import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, Min, MinLength } from 'class-validator';

export class RegisterDto {

    @ApiProperty({
        example: "name@example.com",
        description: "user email",
        required: true
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: "name",
        description: "User name",
        required: true
    })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({
        example: "password123",
        description: "User password",
        required: true
    })
    @IsString()
    @IsNotEmpty()
    // @MinLength(6, {"message": "Password is too short. Minimum length is 6 characters."})
    password: string;

    @ApiProperty({
        example: "password123",
        description: "Confirm password",
        required: true
    })
    @IsString()
    @IsNotEmpty()
    confirmPassword: string;
}