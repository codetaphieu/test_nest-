import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LogoutDto {
    @ApiProperty({
        example: "ey... (chuỗi refresh token của bạn)",
        description: "Refresh token để thực hiện đăng xuất"
    })
    @IsString()
    @IsNotEmpty()
    // Thêm dấu ! vào đây để hết lỗi đỏ
    refreshToken!: string; 
}