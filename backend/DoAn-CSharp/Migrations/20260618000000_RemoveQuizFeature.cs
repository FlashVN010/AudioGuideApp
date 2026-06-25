using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace src.Migrations
{
    /// <inheritdoc />
    public partial class RemoveQuizFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Xóa bảng con (có FK) trước, bảng cha sau, để tránh lỗi vi phạm khóa ngoại.
            migrationBuilder.DropTable(
                name: "QuizQuestionTranslations");

            migrationBuilder.DropTable(
                name: "QuizQuestions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Khôi phục lại đúng cấu trúc bảng QuizQuestions/QuizQuestionTranslations
            // như trong AppDbContextModelSnapshot.cs trước khi bị xóa, để lệnh
            // `dotnet ef database update <migration_trước>` (rollback) vẫn hoạt động.
            migrationBuilder.CreateTable(
                name: "QuizQuestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    POIId = table.Column<int>(type: "INTEGER", nullable: false),
                    QuestionText = table.Column<string>(type: "TEXT", nullable: false),
                    AnswerA = table.Column<string>(type: "TEXT", nullable: false),
                    AnswerB = table.Column<string>(type: "TEXT", nullable: false),
                    AnswerC = table.Column<string>(type: "TEXT", nullable: false),
                    AnswerD = table.Column<string>(type: "TEXT", nullable: false),
                    CorrectOption = table.Column<string>(type: "TEXT", nullable: false),
                    ExplanationText = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuizQuestions_POIs_POIId",
                        column: x => x.POIId,
                        principalTable: "POIs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuizQuestionTranslations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    QuizQuestionId = table.Column<int>(type: "INTEGER", nullable: false),
                    LanguageCode = table.Column<string>(type: "TEXT", nullable: false),
                    QuestionText = table.Column<string>(type: "TEXT", nullable: false),
                    AnswerA = table.Column<string>(type: "TEXT", nullable: false),
                    AnswerB = table.Column<string>(type: "TEXT", nullable: false),
                    AnswerC = table.Column<string>(type: "TEXT", nullable: false),
                    AnswerD = table.Column<string>(type: "TEXT", nullable: false),
                    ExplanationText = table.Column<string>(type: "TEXT", nullable: false),
                    OriginalTextHash = table.Column<string>(type: "TEXT", nullable: false),
                    TranslatedTextHash = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizQuestionTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuizQuestionTranslations_QuizQuestions_QuizQuestionId",
                        column: x => x.QuizQuestionId,
                        principalTable: "QuizQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuizQuestions_POIId",
                table: "QuizQuestions",
                column: "POIId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizQuestionTranslations_QuizQuestionId",
                table: "QuizQuestionTranslations",
                column: "QuizQuestionId");
        }
    }
}
