package dto

type ProductCategoryAttribute struct {
	ID           int32   `json:"id"`
	Name         string  `json:"name"`
	DataType     string  `json:"dataType"`
	Unit         *string `json:"unit"`
	Required     bool    `json:"required"`
	Comparable   bool    `json:"comparable"`
	DisplayOrder int32   `json:"displayOrder"`
}

type ProductCategory struct {
	ID               int32                      `json:"id"`
	ParentCategoryID *int32                     `json:"parentCategoryId"`
	Name             string                     `json:"name"`
	Description      string                     `json:"description"`
	Attributes       []ProductCategoryAttribute `json:"attributes"`
}
