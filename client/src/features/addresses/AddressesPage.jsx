import { useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useCreateAddressMutation, useDeleteAddressMutation, useGetAddressesQuery, useUpdateAddressMutation } from "../../app/api.js";

const empty = { label: "home", recipientName: "", phone: "", line1: "", area: "", city: "", state: "", postalCode: "", instructions: "", isDefault: false };

export function AddressesPage() {
  const user = useSelector((state) => state.auth.user);
  const { data, isLoading } = useGetAddressesQuery(undefined, { skip: !user });
  const [createAddress, request] = useCreateAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [form, setForm] = useState(empty);
  if (!user) return <Navigate to="/login" replace/>;
  const addresses = data?.data.addresses ?? [];
  const update = (event) => setForm((value) => ({ ...value, [event.target.name]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); try { await createAddress(form).unwrap(); setForm(empty); } catch { /* shown below */ } };
  return <main className="addresses-page"><section className="addresses-heading"><span className="kicker">Your saved places</span><h1>Delivery addresses</h1><p>Save home, work, or anywhere else you frequently order to.</p></section><div className="addresses-layout"><section className="address-list"><h2>Saved addresses</h2>{isLoading ? <p>Loading…</p> : addresses.length === 0 ? <div className="address-empty">No saved addresses yet.</div> : addresses.map((address) => <article key={address._id}><div className="address-icon">{address.label === "home" ? "⌂" : address.label === "work" ? "▣" : "⌖"}</div><div><div><h3>{address.label}</h3>{address.isDefault && <span>Default</span>}</div><b>{address.recipientName} · {address.phone}</b><p>{address.line1}, {address.area}, {address.city}, {address.state} {address.postalCode}</p>{address.instructions && <small>{address.instructions}</small>}<div className="address-actions">{!address.isDefault && <button onClick={() => updateAddress({id:address._id,isDefault:true})}>Make default</button>}<button className="danger" onClick={() => deleteAddress(address._id)}>Delete</button></div></div></article>)}</section><section className="address-form-card"><h2>Add an address</h2><form className="address-form" onSubmit={submit}><label>Label<select name="label" value={form.label} onChange={update}><option value="home">Home</option><option value="work">Work</option><option value="other">Other</option></select></label><label>Recipient<input name="recipientName" value={form.recipientName} onChange={update} required/></label><label>Phone<input name="phone" value={form.phone} onChange={update} required/></label><label className="full">Address line<input name="line1" value={form.line1} onChange={update} required/></label><label>Area<input name="area" value={form.area} onChange={update} required/></label><label>City<input name="city" value={form.city} onChange={update} required/></label><label>State<input name="state" value={form.state} onChange={update} required/></label><label>Postal code<input name="postalCode" value={form.postalCode} onChange={update} required/></label><label className="full">Delivery instructions <span>(optional)</span><textarea name="instructions" value={form.instructions} onChange={update}/></label><label className="checkbox full"><input type="checkbox" checked={form.isDefault} onChange={(event) => setForm({...form,isDefault:event.target.checked})}/>Use as default address</label>{request.error && <div className="owner-error full">{request.error.data?.message ?? "Could not save address"}</div>}<button className="owner-primary full" disabled={request.isLoading}>Save address</button></form></section></div></main>;
}
