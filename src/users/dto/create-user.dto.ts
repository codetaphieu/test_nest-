import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, MinLength, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateUserDto {

    // @ApiProperty({
    //     example: "4350347814"
    // })
    // @IsString()
    // @IsNotEmpty()
    // id: string;

    @ApiProperty({
        example: "name@example.com",
        description: "User email"
    })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({
        example: "Hieu",
        description: "User name"
    })
    @IsString()
    @IsNotEmpty()
    username!: string;

    @ApiProperty({
        example: "mypassword123",
        description: "User password"
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6, { message: "Password is 6 minn himar" })
    password!: string;
}