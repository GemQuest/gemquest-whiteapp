use {
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::AssociatedToken,
        metadata::{
            create_metadata_accounts_v3,
            set_and_verify_collection,
            mpl_token_metadata::types::{DataV2, Collection},
            CreateMetadataAccountsV3,
            SetAndVerifyCollection,
            Metadata,
        },
        token::{mint_to, Mint, MintTo, Token, TokenAccount},
    },
};
use std::boxed::Box;

pub const RECEIPT_SEED: &[u8] = b"receipt";

#[derive(Accounts)]
pub struct CreateReceipt<'info> {
    /// CHECK: This is the user account that will receive the receipt
    pub user: AccountInfo<'info>,
    #[account(mut)]
    pub admin: Signer<'info>,
    /// CHECK: Validate address by deriving pda
    #[account(
        mut,
        seeds = [b"metadata", token_metadata_program.key().as_ref(), mint_receipt_account.key().as_ref()],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub metadata_account: UncheckedAccount<'info>,
    #[account(
        init,
        payer = admin,
        mint::decimals = 0,
        mint::authority = admin.key(),
        mint::freeze_authority = admin.key(),
    )]
    pub mint_receipt_account: Box<Account<'info, Mint>>,
    #[account(
        init,
        payer = admin,
        associated_token::mint = mint_receipt_account,
        associated_token::authority = user,
    )]
    pub associated_receipt_token_account: Box<Account<'info, TokenAccount>>,
    pub collection_mint: Box<Account<'info, Mint>>,
    /// CHECK: We're going to use this with Metaplex
    #[account(
        seeds = [b"metadata", token_metadata_program.key().as_ref(), collection_mint.key().as_ref()],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub collection_metadata: UncheckedAccount<'info>,
    /// CHECK: We're going to use this with Metaplex
    #[account(
        seeds = [b"metadata", token_metadata_program.key().as_ref(), collection_mint.key().as_ref(), b"edition"],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub collection_master_edition: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_receipt(
    ctx: Context<CreateReceipt>,
    receipt_name: String,
    receipt_symbol: String,
    receipt_uri: String,
) -> Result<()> {
    if receipt_name.is_empty() || receipt_symbol.is_empty() || receipt_uri.is_empty() {
        return Err(ErrorCode::InvalidInput.into());
    }

    mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint_receipt_account.to_account_info(),
                to: ctx.accounts.associated_receipt_token_account.to_account_info(),
                authority: ctx.accounts.admin.to_account_info(),
            },
        ),
        1,
    )?;

    create_metadata_accounts_v3(
        CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata_account.to_account_info(),
                mint: ctx.accounts.mint_receipt_account.to_account_info(),
                mint_authority: ctx.accounts.admin.to_account_info(),
                update_authority: ctx.accounts.admin.to_account_info(),
                payer: ctx.accounts.admin.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        DataV2 {
            name: receipt_name,
            symbol: receipt_symbol,
            uri: receipt_uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: Some(Collection {
                verified: false,
                key: ctx.accounts.collection_mint.key(),
            }),
            uses: None,
        },
        true,
        false,
        None,
    )?;

    set_and_verify_collection(
        CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            SetAndVerifyCollection {
                metadata: ctx.accounts.metadata_account.to_account_info(),
                collection_authority: ctx.accounts.admin.to_account_info(),
                payer: ctx.accounts.admin.to_account_info(),
                update_authority: ctx.accounts.admin.to_account_info(),
                collection_mint: ctx.accounts.collection_mint.to_account_info(),
                collection_metadata: ctx.accounts.collection_metadata.to_account_info(),
                collection_master_edition: ctx.accounts.collection_master_edition.to_account_info(),
            },
        ),
        None,
    )?;

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid input provided.")]
    InvalidInput,
    #[msg("Unauthorized access.")]
    Unauthorized,
}