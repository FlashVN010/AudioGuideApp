using System.ComponentModel.DataAnnotations;

namespace src.Models.DTOs
{
    public class UpdateLanguageDto
    {
        [Required]
        public int POIId { get; set; }

        [Required]
        public string SessionId { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string LanguageCode { get; set; } = string.Empty;
    }
}
