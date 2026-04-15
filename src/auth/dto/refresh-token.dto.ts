import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
    @ApiProperty({
        example: "ey...",
        description: "Mã làm mới để duy trì phiên làm việc của nông dân"
    })
    @IsNotEmpty()
    @IsString()
    // Thêm ! để báo cho TypeScript là biến này sẽ luôn có giá trị từ request
    refreshToken!: string; 
}