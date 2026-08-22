import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { createAddress, deleteAddress, listAddresses, updateAddress } from "./address.controller.js";
import { addressParamsSchema, createAddressSchema, updateAddressSchema } from "./address.schemas.js";

export const addressRouter = Router();
addressRouter.use(authenticate, authorize("customer", "restaurantOwner"));
addressRouter.get("/", listAddresses);
addressRouter.post("/", validate(createAddressSchema), createAddress);
addressRouter.patch("/:addressId", validate(updateAddressSchema), updateAddress);
addressRouter.delete("/:addressId", validate(addressParamsSchema), deleteAddress);
